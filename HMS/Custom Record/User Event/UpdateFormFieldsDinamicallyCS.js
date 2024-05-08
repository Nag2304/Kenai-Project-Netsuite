/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @author Midware
 * @Website www.midware.net
 * @Developer Reinaldo Stephens Chaves
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log", "N/search", "N/ui/dialog", "../Global/ConstantsClientScript"], function (require, exports, log, search, dialog, Constants) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.urlRedirectToChangePropertySaleStatusForm = exports.fieldChanged = exports.pageInit = void 0;
    function pageInit(pContext) {
        try {
            var urlParams = location.search.substring(1);
            console.log("urlParams: " + urlParams);
            console.log(jQuery("#custpage_pending_notification1").val());
            console.log(jQuery("#custpage_closing_notify_date1").val());
            // if (jQuery("#custpage_available_pending").val()) {
            // 	if (!jQuery("#custpage_mls_region2").val()) {
            // 		pContext.currentRecord.getField({fieldId: "custpage_mls_region2"}).isDisabled = false;
            // 	}
            // }
            var date = new Date();
            var month = date.getUTCMonth() + 1; //months from 1-12
            var day = date.getUTCDate();
            var year = date.getUTCFullYear();
            if (!jQuery("#custpage_pending_notification1").val()) {
                console.log("Enter");
                jQuery("#custpage_pending_notification1").val(month + '/' + day + '/' + year);
            }
            if (!jQuery("#custpage_closing_notify_date1").val()) {
                jQuery("#custpage_closing_notify_date1").val(month + '/' + day + '/' + year);
            }
            var JSONUrlParams = JSON.parse('{"' + urlParams.replace(/&/g, '","').replace(/=/g, '":"') + '"}', function (key, value) { return key === "" ? value : decodeURIComponent(value); });
            if (JSONUrlParams) {
                if (JSONUrlParams.houseno) {
                    search.lookupFields.promise({ type: 'customrecord_property_record', id: JSONUrlParams.houseno, columns: ['custrecord_purchase_contract', 'custrecord_hud1'] }).then(function (result) {
                        var contract = result.custrecord_purchase_contract;
                        var hb1 = result.custrecord_hud1;
                        if (contract && contract[0]) {
                            var contractName = contract[0].text;
                            var input = jQuery("input[name='custpage_purchase_contract']");
                            if (input.length)
                                input.parent().append("<p>Current File: ".concat(contractName, "</p>"));
                        }
                        if (hb1 && hb1[0]) {
                            var hb1Name = hb1[0].text;
                            var input = jQuery("input[name='custpage_hud1']");
                            if (input.length)
                                input.parent().append("<p>Current File: ".concat(hb1Name, "</p>"));
                        }
                    }).catch(function onRejected(reason) {
                        console.log(reason);
                    });
                }
            }
        }
        catch (error) {
            console.log(error);
        }
    }
    exports.pageInit = pageInit;
    function fieldChanged(pContext) {
        log.debug("Client Script", "Field Changed");
        var scriptContext = pContext;
        var fieldName = scriptContext.fieldId;
        log.debug("Field Identifier", fieldName);
        switch (fieldName) {
            case Constants.PROCEED_FORM_DEFAULT.saleStatusField.id: {
                var status_1 = pContext.currentRecord.getValue({ fieldId: fieldName }).toString();
                if (status_1 && (status_1 == Constants.SALES_STATUS_LIST.available.value || status_1 == Constants.SALES_STATUS_LIST.pending.value)) {
                    var formFieldsJSON = Constants.PROCEED_FORM;
                    for (var field in formFieldsJSON) {
                        var fieldId = formFieldsJSON[field].id;
                        pContext.currentRecord.setValue({ fieldId: fieldId, value: "" });
                    }
                }
                break;
            }
            case Constants.PROCEED_FORM.primaryRealEstateAgentName.id: {
                //let agentNameObj = pContext.currentRecord.getValue({ fieldId: 'id' });
                var agentName = pContext.currentRecord.getValue({ fieldId: fieldName }).toString();
                if (agentName) {
                    var agentId = search.lookupFields({
                        id: agentName,
                        type: Constants.AGENT_RECORD.type,
                        columns: [Constants.AGENT_RECORD.id]
                    }).custrecord_agent_id;
                    var brokerageId = search.lookupFields({
                        id: agentName,
                        type: Constants.AGENT_RECORD.type,
                        columns: [Constants.AGENT_RECORD.brokerageName]
                    }).custrecord_brokerage;
                    pContext.currentRecord.setValue({
                        fieldId: Constants.PROCEED_FORM.brokerageName.id,
                        value: brokerageId[0].value
                    });
                    if (agentId) {
                        pContext.currentRecord.setValue({
                            fieldId: Constants.PROCEED_FORM.primaryAgentId.id,
                            //@ts-ignore
                            value: agentId
                        });
                    }
                    else {
                        pContext.currentRecord.setValue({
                            fieldId: Constants.PROCEED_FORM.primaryAgentId.id,
                            value: ""
                        });
                    }
                }
                break;
            }
            case Constants.PROCEED_FORM.additionalAgentName.id: {
                var agentName = pContext.currentRecord.getValue({ fieldId: fieldName }).toString();
                if (agentName) {
                    var agentId = search.lookupFields({
                        id: agentName,
                        type: Constants.AGENT_RECORD.type,
                        columns: [Constants.AGENT_RECORD.id]
                    }).custrecord_agent_id;
                    if (agentId) {
                        pContext.currentRecord.setValue({
                            fieldId: Constants.PROCEED_FORM.additionalAgentId.id,
                            //@ts-ignore
                            value: agentId,
                        });
                    }
                    else {
                        pContext.currentRecord.setValue({
                            fieldId: Constants.PROCEED_FORM.additionalAgentId.id,
                            value: ""
                        });
                    }
                }
                break;
            }
            case Constants.PROCEED_FORM.brokerageName.id: {
                var brokerName = pContext.currentRecord.getValue({ fieldId: fieldName }).toString();
                if (brokerName) {
                    var brokerId = search.lookupFields({
                        id: brokerName,
                        type: Constants.BROKER_RECORD.type,
                        columns: [Constants.BROKER_RECORD.id]
                    }).custrecord7;
                    if (brokerId) {
                        pContext.currentRecord.setValue({
                            fieldId: Constants.PROCEED_FORM.brokerageId.id,
                            //@ts-ignore
                            value: brokerId,
                        });
                    }
                    else {
                        pContext.currentRecord.setValue({
                            fieldId: Constants.PROCEED_FORM.brokerageId.id,
                            value: ""
                        });
                    }
                }
                break;
            }
            default: {
                break;
            }
        }
        if (fieldName == "custpage_current_list_price") {
            console.log(jQuery("#custpage_current_list_price").val());
            var buttonSend = {
                label: 'Yes',
                value: 0
            };
            var buttonCancel = {
                label: 'No',
                value: 1
            };
            if (jQuery("#custpage_current_list_price").val()) {
                var popup = dialog.create({ title: "New listing amendment?", message: "Do you want to create a new listing amendment?", buttons: [buttonSend, buttonCancel] });
                popup.then(function (result) {
                    if (Number(result) == 1) {
                        console.log("NO");
                    }
                    if (Number(result) == 0) {
                        console.log("Yes");
                        jQuery("#custpage_create_amedment").val("yes");
                    }
                });
            }
        }
    }
    exports.fieldChanged = fieldChanged;
    function urlRedirectToChangePropertySaleStatusForm(urlSuitelet) {
        var origin = document.location.origin.toString();
        var urlButton = origin + urlSuitelet;
        window.open(urlButton, "_blank");
    }
    exports.urlRedirectToChangePropertySaleStatusForm = urlRedirectToChangePropertySaleStatusForm;
});
