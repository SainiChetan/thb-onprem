export let constants = {
    // labSettingsTable: function () {
    //     if (process.env.NODE_ENV != "production") {
    //         return "lab_settings_beta";
    //     }
    //     return "lab_settings"

    // },
    // getAthenaWorkGroupForProfile: function () {
    //     if (process.env.NODE_ENV != 'production') {
    //         return 'QB-beta';
    //     }
    //     return 'QB-prod';
    // },

    // getDmrMetaUpdateLambda: function () {
    //     if (process.env.NODE_ENV != 'production') {
    //         return 'dmr-merge-pipeline-dev-metaStepHandler';
    //     }
    //     return 'dmr-merge-pipeline-production-metaStepHandler';
    // },

    // getCommBucketName: function () {
    //     if (process.env.NODE_ENV != "production") {
    //         return "thb-communications-beta";
    //     }
    //     return "thb-communications"
    // },
    commIncludeConditionViewAlias: "comm_include",
    commExcludeConditionViewAlias: "comm_exclude",
    dashboard_queries_table: 'dashboard_queries',
    connect_table: "comm_connect_sms_logs",
    thb_sms_ready_feeds_liverun_table: "thb_ready_comm_feeds",
    thb_sms_sent_summary_liverun_table: "thb_sms_sent_summary_liverun",
    thb_sms_status_summary_deliver_table: "thb_sms_status_summary_deliver",
    // execution_results_connect_table: function () {
    //     if (process.env.NODE_ENV != "production") {
    //         return "execution_results_connect_beta";
    //     }
    //     return "execution_results_connect"
    // },
    // server_list_dynamo_table: "server_list",
    // dryRunDatabase: "dryruns",
    // sms_camp_sch_notification_const: "SMS-CAMPAIGN-SCH",
    live_comm_database: function () {
        if (process.env.NODE_ENV != "production") {
            return 'liverun_beta';
        }
        return 'liverun'
    },
    // getFeedRepairLambda: function () {
    //     if (process.env.NODE_ENV != 'production') {
    //         return 'athena-layer-dev-feedRepairHandler';
    //     }
    //     return 'athena-layer-prod-feedRepairHandler';
    // },
    pep_historical_cleaned_data_table: "pep_historical_cleaned_data",
    pep_feeds_tags_table: "pep_feeds",
    patients_pii: 'patients_pii',
    billing_table: 'billing',
    serverListDbTable: 'server_list',
    athena_query_channel: function () {
        if (process.env.NODE_ENV != 'production') {
            return "athena_query_notification_channel_beta";
        }
        return "athena_query_notification_channel";
    },
    "execution_map": "execution_map",
    "cache_table": "athena-cache-layer",
    "notification_icon": "https://thehealthybillion.com/images/thb/landingpage/logo.png",
    //database:"poc",
    database: function () {
        if (process.env.NODE_ENV != 'production') {
            return constants.devDb;
        }
        return constants.prodDb;
    },
    getAthenaQueryExecutionsBucket: function () {
        if (process.env.NODE_ENV != 'production') {
            return 'athena-query-executions-beta';
        }
        return 'athena-query-executions';
    },
    devDb: "public",
    prodDb: "public",
    getDatabaseCorrespondingToEnv: function (issimulationmode) {
        return constants.prodDb;

    },
    "bm": "biomarkers_numeric",
    "bm_cta": "biomarkers_summary_CTA",
    patientLeadsDatabase: "sync_leads",
    //dmrDatabase: "dmr_dev",
    getdmrDBCorrespondingToEnv: function () {
        if (process.env.NODE_ENV != 'production') {
            return "dmr_ppe115";
        }
        return "dmr_prod19";

    },
    getdmrTableCorrespondingToEnv: function () {
        if (process.env.NODE_ENV != 'production') {
            // return "doctors_new";
            return "doctors_merged";
        }
        return "doctors_merged";

    },
    getpatientLeadsTableCorrespondingToEnv: function () {
        if (process.env.NODE_ENV != 'production') {
            return "sync_clean_leads_beta";
        }
        return "sync_clean_leads";

    },

    scopemap: {
        "connect": "pc",
        "engagement": "en",
        "nps": "nps"
    },

    getEmailBasedEventsDBCorrespondingToEnv: function () {
        if (process.env.NODE_ENV != 'production') {
            return "liverun_beta";
        }
        return "liverun";

    },
    getEmailBasedTableorrespondingToEnv: function () {
        return "thb_email_status_summary_deliver";

    },
    getEventsTableCorrespondingToEnv: function () {
        if (process.env.NODE_ENV != 'production') {
            return "pep_events_dev";
        }
        return "pep_events_prod";
    },
    getEventsDBCorrespondingToEnv : function () {
        if (process.env.NODE_ENV != 'production') {
            return "pep_events_dev";
        }
        return "pep_events_prod";
    }



}