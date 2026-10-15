const { DataTypes } = require("sequelize");

function ContactMessageModel(sequelize) {
  const ContactMessage = sequelize.define(
    "ContactMessage",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(160),
        allowNull: false,
      },
      subject: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(32),
        defaultValue: "unread", // 'unread', 'read', 'in_progress', 'resolved', 'archived'
      },
      ip: {
        type: DataTypes.STRING(64),
        defaultValue: "",
      },
      userAgent: {
        type: DataTypes.STRING(255),
        defaultValue: "",
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "contact_messages",
      timestamps: true,
    }
  );

  return ContactMessage;
}

function BugReportModel(sequelize) {
  const BugReport = sequelize.define(
    "BugReport",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(50),
        defaultValue: "geral", // 'game_3d', 'interface_web', 'chat', 'perfil', 'loja_economia', 'login_conta', 'outro'
      },
      severity: {
        type: DataTypes.STRING(32),
        defaultValue: "media", // 'baixa', 'media', 'alta', 'critica'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      stepsToReproduce: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "",
      },
      expectedBehavior: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "",
      },
      screenshotUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: "",
      },
      email: {
        type: DataTypes.STRING(160),
        allowNull: true,
        defaultValue: "",
      },
      status: {
        type: DataTypes.STRING(32),
        defaultValue: "aberto", // 'aberto', 'investigando', 'corrigido', 'rejeitado'
      },
      ip: {
        type: DataTypes.STRING(64),
        defaultValue: "",
      },
      userAgent: {
        type: DataTypes.STRING(255),
        defaultValue: "",
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "bug_reports",
      timestamps: true,
    }
  );

  return BugReport;
}

function UserSuggestionModel(sequelize) {
  const UserSuggestion = sequelize.define(
    "UserSuggestion",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(50),
        defaultValue: "geral", // 'jogabilidade', 'social', 'visual', 'economia', 'nova_funcao', 'outro'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      expectedBenefit: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "",
      },
      votesCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      email: {
        type: DataTypes.STRING(160),
        allowNull: true,
        defaultValue: "",
      },
      status: {
        type: DataTypes.STRING(32),
        defaultValue: "em_votacao", // 'em_votacao', 'em_analise', 'planejado', 'implementado', 'recusado'
      },
      ip: {
        type: DataTypes.STRING(64),
        defaultValue: "",
      },
      userAgent: {
        type: DataTypes.STRING(255),
        defaultValue: "",
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "user_suggestions",
      timestamps: true,
    }
  );

  return UserSuggestion;
}

function SuggestionVoteModel(sequelize) {
  const SuggestionVote = sequelize.define(
    "SuggestionVote",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      suggestionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      ip: {
        type: DataTypes.STRING(64),
        defaultValue: "",
      },
    },
    {
      tableName: "suggestion_votes",
      timestamps: true,
    }
  );

  return SuggestionVote;
}

async function ensureFeedbackTables(sequelize) {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "contact_messages" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(120) NOT NULL,
        "email" VARCHAR(160) NOT NULL,
        "subject" VARCHAR(200) NOT NULL,
        "message" TEXT NOT NULL,
        "status" VARCHAR(32) DEFAULT 'unread',
        "ip" VARCHAR(64) DEFAULT '',
        "userAgent" VARCHAR(255) DEFAULT '',
        "userId" INTEGER,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "bug_reports" (
        "id" SERIAL PRIMARY KEY,
        "title" VARCHAR(200) NOT NULL,
        "category" VARCHAR(50) DEFAULT 'geral',
        "severity" VARCHAR(32) DEFAULT 'media',
        "description" TEXT NOT NULL,
        "stepsToReproduce" TEXT DEFAULT '',
        "expectedBehavior" TEXT DEFAULT '',
        "screenshotUrl" VARCHAR(500) DEFAULT '',
        "email" VARCHAR(160) DEFAULT '',
        "status" VARCHAR(32) DEFAULT 'aberto',
        "ip" VARCHAR(64) DEFAULT '',
        "userAgent" VARCHAR(255) DEFAULT '',
        "userId" INTEGER,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE "bug_reports" ADD COLUMN IF NOT EXISTS "screenshotUrl" VARCHAR(500) DEFAULT '';

      CREATE TABLE IF NOT EXISTS "user_suggestions" (
        "id" SERIAL PRIMARY KEY,
        "title" VARCHAR(200) NOT NULL,
        "category" VARCHAR(50) DEFAULT 'geral',
        "description" TEXT NOT NULL,
        "expectedBenefit" TEXT DEFAULT '',
        "votesCount" INTEGER DEFAULT 0,
        "email" VARCHAR(160) DEFAULT '',
        "status" VARCHAR(32) DEFAULT 'em_votacao',
        "ip" VARCHAR(64) DEFAULT '',
        "userAgent" VARCHAR(255) DEFAULT '',
        "userId" INTEGER,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE "user_suggestions" ADD COLUMN IF NOT EXISTS "votesCount" INTEGER DEFAULT 0;

      CREATE TABLE IF NOT EXISTS "suggestion_votes" (
        "id" SERIAL PRIMARY KEY,
        "suggestionId" INTEGER NOT NULL,
        "userId" INTEGER,
        "ip" VARCHAR(64) DEFAULT '',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_suggestion_votes_sid" ON "suggestion_votes" ("suggestionId");
    `);
  } catch (err) {
    console.warn("⚠️ [ensureFeedbackTables] Aviso:", err.message);
  }
}

module.exports = {
  ContactMessageModel,
  BugReportModel,
  UserSuggestionModel,
  SuggestionVoteModel,
  ensureFeedbackTables,
};
