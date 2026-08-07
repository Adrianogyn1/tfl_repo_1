const { Sequelize , Op} = require('sequelize');
const path = require('path');
const fs = require('fs'); 
const modelsInitializer = require('./Models/index.js');
const gameModels = require('./Models/game/index.js');
const pathData =path.join("./", "nodedata.sqlite");// path.join("/home/not/The Fantasy Life", "nodedata.sqlite");

// Garante que a pasta existe
const dataDir = path.dirname(pathData);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Configuração da conexão usando SQLite com WAL habilitado
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: pathData,
    logging: false,
    // Define o tempo máximo de espera por uma liberação antes de dar erro de Busy
    retry: {
        match: [
            /SQLITE_BUSY/
        ],
        name: 'query',
        max: 5
    }
});

// Ativa o modo WAL na conexão do banco
sequelize.query('PRAGMA journal_mode=WAL;')
    .then(() => console.log('⚡ Modo SQLite WAL ativado (Pronto para múltipla leitura/escrita)!'))
    .catch(err => console.error('Erro ao ativar WAL:', err));

// Inicializa os modelos passando a conexão
const models = modelsInitializer(sequelize);

// Executa as associações/relacionamentos entre as tabelas
Object.keys(models).forEach(modelName => {
    if (typeof models[modelName].associate === 'function') {
        models[modelName].associate(models);
    }
});

// Sincroniza as tabelas
sequelize.sync({ alter: true })
    .then(() => console.log('📁 Banco de dados e tabelas sincronizados com sucesso!!!'))
    .catch(err => console.error('❌ Erro ao sincronizar o banco de dados:', err));


function translateOperator(opStr) {
    const map = {
        '=': Op.eq,
        '⁼': Op.eq,
        '!=': Op.ne,
        '>': Op.gt,
        '<': Op.lt,
        '>=': Op.gte,
        '<=': Op.lte,
        'like': Op.like,
        '≃': Op.like
    };
    return map[opStr.trim().toLowerCase()] || Op.eq;
}

function parseOrderByString(queryString) {
    if (!queryString || !queryString.includes('|')) return [['id', 'ASC']];

    const orderPart = queryString.split('|')[1].trim(); 
    const [field, direction] = orderPart.split(/\s+/);

    if (field) {
        const dir = (direction && direction.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';
        return [[field, dir]];
    }

    return [['id', 'ASC']];
}

function parseQueryStringToWhere(queryString) {
    if (!queryString) return {};

    // Remove a parte do order by se ela existir para não atrapalhar
    let filterPart = queryString.split('|')[0].trim();
    
    // Remove o prefixo 'where' se ele existir no início da string
    filterPart = filterPart.replace(/^where/i, '').trim();
    if (!filterPart) return {};

    const whereCondition = {};
    const regex = /(and|or|,)?\s*\[([^,]+),([^,]+),([^\]]+)\]/gi;
    let match;

    const andConditions = [];
    const orConditions = [];

    while ((match = regex.exec(filterPart)) !== null) {
        const connector = match[1] ? match[1].toLowerCase() : ',';
        const field = match[2].trim();
        const operator = match[3].trim();
        let value = match[4].trim();

        value = value.replace(/^['"]|['"]$/g, '');

        if (!isNaN(value) && value !== '') {
            value = Number(value);
        } else if (value === 'true') {
            value = true;
        } else if (value === 'false') {
            value = false;
        }

        const seqOp = translateOperator(operator);
        
        // Se for operador LIKE / ≃, adiciona as porcentagens para a busca por padrão
        const finalValue = (seqOp === Op.like) ? `%${value}%` : value;
        const conditionBlock = { [field]: { [seqOp]: finalValue } };

        if (connector === 'or') {
            orConditions.push(conditionBlock);
        } else {
            andConditions.push(conditionBlock);
        }
    }

    // Ajuste para o Sequelize ler corretamente quando houver apenas 1 critério
    if (andConditions.length > 0) {
        if (andConditions.length === 1) {
            Object.assign(whereCondition, andConditions[0]);
        } else {
            whereCondition[Op.and] = andConditions;
        }
    }
    
    if (orConditions.length > 0) {
        if (orConditions.length === 1 && andConditions.length === 0) {
            Object.assign(whereCondition, orConditions[0]);
        } else {
            whereCondition[Op.or] = orConditions;
        }
    }

    return whereCondition;
}


module.exports = {
    sequelize,
    parseOrderByString,
    parseQueryStringToWhere,
    Sequelize,
    ...models
};


/* para o c#
namespace Game.Web.Query
{
    using System;
    using System.Collections.Generic;
    using System.Linq;

    public enum Op { Equals, NotEquals, GreaterThan, LessThan, GreaterOrEqual, LessOrEqual, Like }
    public enum Connect { Default, And, Or }

    public class QuerySearch
    {
        private int _limit;
        private int _skip;
        private List<string> _orders = new List<string>();
        private List<string> _filters = new List<string>();

        public QuerySearch(int limit, int skip, List<OrderParam> orders, params FilterParam[] filters)
        {
            _limit = limit;
            _skip = skip;
            if (orders != null) _orders = orders.Select(o => $"{o.Field} {o.Direction.ToUpper()}").ToList();
            foreach (var f in filters)
            {
                string connectorStr = _filters.Count == 0 ? "" : GetConnectString(f.Connector);
                string valueStr = f.Value is bool b ? b.ToString().ToLower() : f.Value?.ToString() ?? "";
                _filters.Add($"{connectorStr}[{f.Field},{GetOpString(f.Operator)},{valueStr}]");
            }
        }

        public QuerySearch(int limit, int skip, OrderParam order, params FilterParam[] filters) 
            : this(limit, skip, order != null ? new List<OrderParam> { order } : null, filters) { }

        public QuerySearch(int limit, int skip, params FilterParam[] filters) 
            : this(limit, skip, (List<OrderParam>)null, filters) { }

        private string GetOpString(Op op) => op switch
        {
            Op.Equals => "=", Op.NotEquals => "!=", Op.GreaterThan => ">",
            Op.LessThan => "<", Op.GreaterOrEqual => ">=", Op.LessOrEqual => "<=",
            Op.Like => "≃", _ => "="
        };

        private string GetConnectString(Connect c) => c switch { Connect.And => "and", Connect.Or => "or", _ => "," };

        public string Build(string endpoint)
        {
            string f = _filters.Count > 0 ? "where" + string.Join("", _filters) : "";
            string o = _orders.Count > 0 ? " | " + string.Join(", ", _orders) : "";
            return $"{endpoint}?limit={_limit}&offset={_skip}&q={f}{o}";
        }
    }

    public class FilterParam
    {
        public string Field { get; }
        public Op Operator { get; }
        public object Value { get; }
        public Connect Connector { get; }
        public FilterParam(string f, Op o, object v, Connect c = Connect.Default) 
            { Field = f; Operator = o; Value = v; Connector = c; }
    }

    public class OrderParam
    {
        public string Field { get; set; }
        public string Direction { get; set; }
        public OrderParam(string f, string d = "ASC") { Field = f; Direction = d; }
    }
}

/* 
EXEMPLOS DE USO:

using TheFantasyLife.Query;

// 1. Consulta simples sem ordenação
var q1 = new QuerySearch(10, 0, 
    new FilterParam("active", Op.Equals, true)
);

// 2. Consulta com ordenação única e múltiplos filtros
var q2 = new QuerySearch(50, 0, 
    new OrderParam("name", "asc"),
    new FilterParam("name", Op.Like, "adriano"),
    new FilterParam("age", Op.GreaterThan, 18, Connect.And)
);

// 3. Consulta complexa com OR
var q3 = new QuerySearch(20, 0, 
    new OrderParam("id", "desc"),
    new FilterParam("role", Op.Equals, "admin"),
    new FilterParam("role", Op.Equals, "moderator", Connect.Or)
);
*/