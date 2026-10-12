const { DataTypes, UUIDV4 } = require("sequelize");

const PROVEDOR = ["Asaas", "PayPal", "MercadoPago", "PagBank"];
const TRANSACTION_TYPES = ["Buy", "Withdraw", "Deposit", "None"];
const repo = require("../../repositories/repository");

const PaymentBankModel = (sequelize) => {
    const Payment_Bank = sequelize.define("PaymentBank", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: DataTypes.INTEGER, allowNull: true },        // usuário
        avatar_id: { type: DataTypes.INTEGER, allowNull: true },      // profile da carteira
        description: { type: DataTypes.STRING, allowNull: true },     // descrição
        payment_id: { type: DataTypes.STRING, allowNull: true },      // id vindo da API (cobrança ou transferência)
        reference_id: { type: DataTypes.STRING, allowNull: true },    // produto (compra) ou externalReference (saque)
        customer_id: { type: DataTypes.STRING, allowNull: true },     // customer vindo da API
        status: { type: DataTypes.STRING, allowNull: true },
        uid: { type: DataTypes.STRING, allowNull: true, unique: true, defaultValue: DataTypes.UUIDV4 },
        value: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
        provedor: { type: DataTypes.ENUM(...PROVEDOR), allowNull: false, defaultValue: "Asaas" },
        type: { type: DataTypes.ENUM(...TRANSACTION_TYPES), allowNull: false, defaultValue: "None" },
    },
    {
        tableName: "bank_payments",
        timestamps: true,
        indexes: [
            // Mesmo id da API não pode ser registrado duas vezes no mesmo provedor
            { unique: true, fields: ["provedor", "payment_id"] },
            // Idempotência de saque: um externalReference por tipo
            { unique: true, fields: ["type", "reference_id"] },
        ],
    });

    return Payment_Bank;
};

const PaymentWebHookModel = (sequelize) => {
    const Payment_WebHook = sequelize.define("PaymentWebHook", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        event_key: { type: DataTypes.STRING, allowNull: false, unique: true }, // substitui seenEvents
        event: { type: DataTypes.STRING, allowNull: false },
        uid: { type: DataTypes.STRING, allowNull: true, unique: true, defaultValue: DataTypes.UUIDV4 },
        payment_id: { type: DataTypes.STRING, allowNull: true },
        payment_bank_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "bank_payments", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
        },
        receiveAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
        tableName: "bank_webhook",
        timestamps: true,
    });

    return Payment_WebHook;
};

// Associações: chamar após instanciar os dois models
const associatePaymentModels = (Payment_Bank, Payment_WebHook ) => {
    Payment_Bank.hasMany(Payment_WebHook, { foreignKey: "payment_bank_id" });
    Payment_WebHook.belongsTo(Payment_Bank, { foreignKey: "payment_bank_id" });
};

// DTOs
class PaymentWebHook {
    constructor(data = {}) {
        this.id = data.id ?? null;
        this.eventKey = data.eventKey ?? null;
        this.event = data.event ?? null;
        this.uid = data.uid ?? null;
        this.paymentId = data.paymentId ?? null;
        this.paymentBankId = data.paymentBankId ?? null;
        this.receiveAt = data.receiveAt ?? new Date();
    }

    static fromModel(row) {
        const p = row.get({ plain: true });
        return new PaymentWebHook({
            id: p.id, eventKey: p.event_key, event: p.event, uid: p.uid,
            paymentId: p.payment_id, paymentBankId: p.payment_bank_id, receiveAt: p.receiveAt,
        });
    }

    toModel() {
        return {
            event_key: this.eventKey, event: this.event, uid: this.uid,
            payment_id: this.paymentId, payment_bank_id: this.paymentBankId, receiveAt: this.receiveAt,
        };
    }

    static async findById(id) {
        const row = await repo.PaymentWebHook.findOne({ where: { id } });
        if (!row) throw new Error("Webhook not found");
        return PaymentWebHook.fromModel(row);
    }

    async Create() {
        const row = await repo.PaymentWebHook.create(this.toModel());
        this.id = row.id;
        this.uid = row.uid;
        return this;
    }
    async Update() {
        const [count] = await repo.PaymentWebHook.update(this.toModel(), { where: { id: this.id } });
        return count > 0;
    }
    async Delete() {
        return (await repo.PaymentWebHook.destroy({ where: { id: this.id } })) > 0;
    }
    async Save() {
        return this.id ? this.Update() : this.Create();
    }
}

class PaymentBank {
    constructor(data = {}) {
        this.id = data.id ?? null;
        this.userId = data.userId ?? null;
        this.avatarId = data.avatarId ?? null;
        this.description = data.description ?? null;
        this.paymentId = data.paymentId ?? null;
        this.referenceId = data.referenceId ?? null;
        this.customerId = data.customerId ?? null;
        this.status = data.status ?? null;
        this.uid = data.uid ?? null;
        this.value = data.value ?? 0;
        this.provedor = data.provedor ?? "Asaas";
        this.type = data.type ?? "None";
        this.createdAt = data.createdAt ?? null;
        this.updatedAt = data.updatedAt ?? null;
        this.webhooks = data.webhooks ?? [];
    }

    static fromModel(row) {
        const p = row.get({ plain: true });
        return new PaymentBank({
            id: p.id, userId: p.user_id, avatarId: p.avatar_id, description: p.description,
            paymentId: p.payment_id, referenceId: p.reference_id, customerId: p.customer_id,
            status: p.status, uid: p.uid, value: Number(p.value), provedor: p.provedor, type: p.type,
            createdAt: p.createdAt, updatedAt: p.updatedAt,
            webhooks: (p.PaymentWebHooks ?? []).map(w => PaymentWebHook.fromModel({ get: () => w })),
        });
    }

    static async findById(id) {
        const row = await repo.PaymentBank.findOne({
            where: { id },
            include: [{ model: repo.PaymentWebHook }],
        });
        if (!row) throw new Error("Payment not found");
        return PaymentBank.fromModel(row);
    }

    toModel() {
        return {
            user_id: this.userId, avatar_id: this.avatarId, description: this.description,
            payment_id: this.paymentId, reference_id: this.referenceId, customer_id: this.customerId,
            status: this.status, uid: this.uid, value: this.value,
            provedor: this.provedor, type: this.type,
        };
    }

    async Create() {
        const row = await repo.PaymentBank.create(this.toModel());
        this.id = row.id;
        this.uid = row.uid;
        this.createdAt = row.createdAt;
        this.updatedAt = row.updatedAt;
        return this;
    }
    async Update() {
        const [count] = await repo.PaymentBank.update(this.toModel(), { where: { id: this.id } });
        return count > 0;
    }
    async Delete() {
        return (await repo.PaymentBank.destroy({ where: { id: this.id } })) > 0;
    }
    async Save() {
        return this.id ? this.Update() : this.Create();
    }
}


module.exports = {
    PaymentBankModel,
    PaymentWebHookModel,
    associatePaymentModels,
    PROVEDOR,
    TRANSACTION_TYPES,
    PaymentBank,
    PaymentWebHook,
};