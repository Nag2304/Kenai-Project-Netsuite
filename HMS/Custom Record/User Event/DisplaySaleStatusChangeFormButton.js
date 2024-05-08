/**
 * @NAPIVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @author Midware
 * @Website www.midware.net
 * @Developer Reinaldo Stephens Chaves
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log", "N/url", "../Global/Constants"], function (require, exports, log, url, Constants) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.beforeLoad = void 0;
    function beforeLoad(pContext) {
        try {
            var recordId = pContext.newRecord.id;
            log.debug("Script Init", recordId);
            var type = pContext.type;
            log.debug("pContext Type", type);
            if (type == pContext.UserEventType.VIEW) {
                pContext.form.clientScriptModulePath = Constants.CLIENT_SCRIPT_PATH_UE;
                var urlSuitelet = url.resolveScript({
                    scriptId: Constants.SUITELET_SCRIPT_ID,
                    deploymentId: "1",
                    params: {
                        houseno: recordId,
                    }
                });
                log.debug("From UE urlSuitelet", urlSuitelet);
                pContext.form.addButton({
                    label: "Sale Status Change Form",
                    id: "custpage_search_prop",
                    functionName: "urlRedirectToChangePropertySaleStatusForm('".concat(urlSuitelet, "')")
                });
            }
        }
        catch (e) {
            log.error("Execution Error", "Detail ".concat(e));
        }
    }
    exports.beforeLoad = beforeLoad;
});
