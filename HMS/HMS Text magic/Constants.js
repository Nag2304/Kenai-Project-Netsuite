define(["require", "exports"], function (require, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SUITELET = {
        SCRITP_ID: "customscript_mw_send_appointment_msj",
        DEPLOYMENT_ID: "customdeploy_mw_send_appointment_msj_d",
        METODS: {
            getOptions: "getOptions",
            sendMessage: "sendMessage"
        }
    };
    exports.BUTTONS = {
        SEND_MESSAGE: {
            LABEL: "Send Text/SMS",
            ID: "custpage_send_mesage_button",
        }
    };
    exports.APPOINTMENT_FORM = {
        SEND_MESSAGE: {
            LABEL: "Send Message",
            ID: "custpage_send_mesage_button",
        }
    };
    exports.RECORD = {
        APPOINTMENT: {
            ID: "supportcase",
            FIELDS: {
                PRIMARY_BSR: "custevent_builder_sales_rep_subd",
                AGENT: "custevent_caller_name",
                MANAGER: "custevent7"
            }
        }
    };
});
