/**
 * @NAPIVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @author Midware
 * @Website www.midware.net
 * @Developer Reinaldo Stephens Chaves
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log", "N/https", "../../Global/Constants", "../Controllers/UpdatePropertyStatusController"], function (require, exports, log, https, Constants, UpdatePropertyStatusController) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.onRequest = void 0;
    /**
     * Depending on the request chooses the correct function (GET or POST).
     * @param {EntryPoints.Suitelet.onRequestContext} pContext - SuiteletScript event.
     */
    function onRequest(pContext) {
        try {
            log.audit("OnRequest", "Request received");
            var eventMap = {};
            eventMap[https.Method.GET] = handleGet;
            eventMap[https.Method.POST] = handlePost;
            eventMap[pContext.request.method]
                ? eventMap[pContext.request.method](pContext)
                : handleError();
        }
        catch (error) {
            pContext.response.write("Unexpected error. Detail: ".concat(error.message));
            log.error("EXECUTION ERROR", "Detail: ".concat(error));
        }
    }
    exports.onRequest = onRequest;
    /**
     * Handles the GET request. Displays the Change Property Status Form.
     * @param {EntryPoints.Suitelet.onRequestContext} pContext - SuiteletScript event
     */
    function handleGet(pContext) {
        log.audit("BEGIN", "Processing GET request");
        var params = pContext.request.parameters;
        var propertyId = params.houseno;
        var msg = params.msg;
        var newStatus = params.newStatus;
        var oldStatus = params.oldStatus;
        var urlSource = params.urlSource;
        if (Constants.urlSource === "" ||
            Constants.urlSource === undefined ||
            Constants.urlSource === null ||
            Constants.urlSource === "undefined" ||
            Constants.urlSource === "null" ||
            Constants.urlSource === "NULL" ||
            Constants.urlSource === "Null") {
            Constants.urlSource = urlSource;
        }
        log.debug("Router handleGet Constants.urlSource: ", Constants.urlSource);
        log.debug("Handle Get urlSource: ", urlSource);
        log.debug("Parameters", JSON.stringify(params));
        log.debug("Property Identifier", propertyId);
        if (propertyId) {
            if (propertyId.length < 10) {
                if (newStatus && oldStatus) {
                    var response = UpdatePropertyStatusController.createForm(oldStatus, newStatus, propertyId, urlSource);
                    response
                        ? pContext.response.writePage(response)
                        : pContext.response.write("Error, Property Record Not Found");
                }
                else {
                    pContext.response.writePage(UpdatePropertyStatusController.getForm(propertyId, msg));
                }
            }
            else if (!Number(propertyId)) {
                pContext.response.write("Invalid Property Identifier (It must be a number)");
            }
            else {
                pContext.response.write("Invalid Property Identifier");
            }
        }
        else {
            pContext.response.write("Not params were provided");
        }
    }
    /**
     * Handles the POST request. Handles the after submit action.
     * @param {EntryPoints.Suitelet.onRequestContext} pContext - SuiteletScript event
     */
    function handlePost(pContext) {
        log.debug("Router handlePost Constants.urlSource: ", Constants.urlSource);
        var params = pContext.request.parameters;
        var files = pContext.request.files;
        log.debug("Parameters", JSON.stringify(params));
        var purchaseContract = null;
        var hud1 = null;
        var pendingPrintfull1 = null;
        var pendingPrintfull2 = null;
        var closedPrintfull1 = null;
        var closedPrintfull2 = null;
        if (files[Constants.AVAILABLE_TO_PENDING_FORM.purchaseContract.id])
            purchaseContract =
                files[Constants.AVAILABLE_TO_PENDING_FORM.purchaseContract.id];
        log.debug("IF 1", files[Constants.AVAILABLE_TO_PENDING_FORM.pendingPrintfull1.id]);
        if (files[Constants.AVAILABLE_TO_PENDING_FORM.pendingPrintfull1.id])
            pendingPrintfull1 =
                files[Constants.AVAILABLE_TO_PENDING_FORM.pendingPrintfull1.id];
        if (files[Constants.AVAILABLE_TO_PENDING_FORM.pendingPrintfull2.id])
            pendingPrintfull2 =
                files[Constants.AVAILABLE_TO_PENDING_FORM.pendingPrintfull2.id];
        if (files[Constants.CLOSED_STATUS_FORM.hud1.id])
            hud1 = files[Constants.CLOSED_STATUS_FORM.hud1.id];
        if (files[Constants.CLOSED_STATUS_FORM.closedPrintfull1.id])
            closedPrintfull1 =
                files[Constants.CLOSED_STATUS_FORM.closedPrintfull1.id];
        if (files[Constants.CLOSED_STATUS_FORM.closedPrintfull2.id])
            closedPrintfull2 =
                files[Constants.CLOSED_STATUS_FORM.closedPrintfull2.id];
        var submitter = params.submitter;
        switch (submitter) {
            case Constants.SUBMITTER.ok: {
                var response = UpdatePropertyStatusController.okSubmitterForm();
                pContext.response.writePage(response);
                break;
            }
            case Constants.SUBMITTER.proceed: {
                log.debug("Router", "Proceed Button Action");
                var propertyId = params.custpage_housenumber;
                var newStatus = params.custpage_status;
                var oldStatus = params.custpage_oldstatus;
                var urlSource = params.custpage_urlsource;
                log.debug("Handle Post submitter switch urlSource: ", urlSource);
                UpdatePropertyStatusController.displayResult(propertyId, newStatus, oldStatus, urlSource);
                break;
            }
            case Constants.SUBMITTER.submit: {
                log.debug("Router", "Submit Button Action");
                var response = UpdatePropertyStatusController.submitForm(params, purchaseContract, hud1, closedPrintfull1, closedPrintfull2, pendingPrintfull1, pendingPrintfull2);
                pContext.response.writePage(response);
                break;
            }
            default: {
                log.debug("Error", "Invalid submitter");
                break;
            }
        }
    }
    /**
     * Handles errors.
     */
    function handleError() {
        throw {
            name: "UNSUPPORTED_REQUEST_TYPE",
            datails: "This Suilet only supports GET and POST request",
        };
    }
});
