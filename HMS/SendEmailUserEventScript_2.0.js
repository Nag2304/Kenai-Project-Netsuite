/**
 * @NAPIVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @author Midware
 * @Website www.midware.net
 * @Developer Sergio Tijerino
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log", "N/search", "N/record", "N/task", "../Global/Constants"], function (require, exports, log, search, record, task, CONSTANTS) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function beforeSubmit(pContext) {
        try {
            log.debug("Before Submit", "Starting method");
            if (pContext.type == pContext.UserEventType.CREATE || pContext.type == pContext.UserEventType.EDIT) {
                var copy = pContext.newRecord.getValue(CONSTANTS.APPOINTMENT_FIELDS.CREATE_COPY);
                log.debug("Incoming value for " + CONSTANTS.APPOINTMENT_FIELDS.CREATE_COPY, "Value = " + copy);
                var copyValue = copy === "true" ? true : false;
                pContext.newRecord.setValue({ fieldId: CONSTANTS.APPOINTMENT_FIELDS.REN_SESSION, value: copyValue });
                log.debug("Value Copied", "Value Copied = " + copyValue);
            }
        }
        catch (pError) {
            log.error("Before Submit Error", "Error : " + pError);
        }
    }
    exports.beforeSubmit = beforeSubmit;
    function afterSubmit(pContext) {
        try {
            log.debug("After Submit", "Starting method");
            var appointmentId = pContext.newRecord.id;
            if (CONSTANTS.CHECKVALUE(appointmentId)) {
                log.debug("Appointment id", "Id = " + appointmentId);
                log.debug("***Appointment id ", appointmentId + "Context --" + pContext.type);
                var searchResults = search.lookupFields({ type: CONSTANTS.RECORD_TYPES.APPOINTMENT,
                    id: appointmentId.toString(),
                    columns: [CONSTANTS.APPOINTMENT_FIELDS.REN_SESSION, CONSTANTS.APPOINTMENT_FIELDS.BUILDER_SALES_REP,
                        CONSTANTS.APPOINTMENT_FIELDS.LINKED_CASES, CONSTANTS.APPOINTMENT_FIELDS.CALL_STATUS] });
                var renSession = searchResults[CONSTANTS.APPOINTMENT_FIELDS.REN_SESSION];
                var builderSalesRep = searchResults[CONSTANTS.APPOINTMENT_FIELDS.BUILDER_SALES_REP][0].value;
                var linkedCases = searchResults[CONSTANTS.APPOINTMENT_FIELDS.LINKED_CASES];
                var newCallStatus = searchResults[CONSTANTS.APPOINTMENT_FIELDS.CALL_STATUS][0].value;
                log.debug("renSession", renSession);
                log.debug("builderSalesRep", builderSalesRep);
                log.debug("linkedCases", linkedCases);
                log.debug("status", newCallStatus); //Call Status
                var oldRecord = pContext.oldRecord;
                if ((pContext.type == pContext.UserEventType.EDIT || pContext.type == pContext.UserEventType.XEDIT) && oldRecord) {
                    var oldCallStatus = oldRecord.getValue(CONSTANTS.APPOINTMENT_FIELDS.CALL_STATUS);
                    log.debug("New record status", "New Staus = " + newCallStatus);
                    log.debug("Old record Status", "Old Status = " + oldCallStatus);
                    if (CONSTANTS.CHECKVALUE(oldCallStatus) && CONSTANTS.CHECKVALUE(newCallStatus) && oldCallStatus != newCallStatus //Process Inquiry to send an email only if the Call staus
                        && CONSTANTS.CHECKVALUE(linkedCases) && CONSTANTS.CHECKVALUE(builderSalesRep)) {
                        var searchObj = search.create({ type: CONSTANTS.RECORD_TYPES.APPOINTMENT,
                            columns: [CONSTANTS.APPOINTMENT_FIELDS.INTERNAL_ID],
                            filters: [
                                [CONSTANTS.APPOINTMENT_FIELDS.LINKED_CASES, "anyof", linkedCases[0].value],
                                "AND",
                                [CONSTANTS.APPOINTMENT_FIELDS.BUILDER_SALES_REP, "anyof", builderSalesRep]
                            ] });
                        var searchResults_1 = searchObj.run().getRange({ start: 0, end: 100 });
                        log.debug("Search Results", JSON.stringify(searchResults_1));
                        if (searchResults_1 && searchResults_1.length > 0) {
                            for (var i = 0; i < searchResults_1.length; i++) {
                                var recordId = searchResults_1[i].getValue(CONSTANTS.APPOINTMENT_FIELDS.INTERNAL_ID);
                                log.debug("Linked case id", "Id = " + recordId + " ");
                                record.submitFields({ type: CONSTANTS.RECORD_TYPES.APPOINTMENT, id: recordId.toString(), values: { status: newCallStatus } });
                                log.debug("Value saved", "The status was saved correctly on the appointment " + recordId);
                            }
                        }
                        else {
                            pContext.newRecord.setValue({ fieldId: CONSTANTS.APPOINTMENT_FIELDS.CALL_STATUS, value: true });
                            log.debug("No linked cases found", "Setting current Appointment status = true");
                        }
                    }
                }
                //----------------------------------------------------------------------------------------------------------------------
                //Delete || true when deployed to production
                if ((pContext.type == pContext.UserEventType.CREATE || pContext.type == pContext.UserEventType.EDIT) && (renSession != true || true)) {
                    log.debug("About to schedule the script", "RenSession Value  = " + renSession);
                    var appointmentId_1 = pContext.newRecord.id;
                    log.debug("Appointment id", appointmentId_1);
                    task.create({
                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                        scriptId: CONSTANTS.SCHEDULED_SCRIPT.ID,
                        deploymentId: CONSTANTS.SCHEDULED_SCRIPT.DEPLOYMENT,
                        params: {
                            "custscript_mw_send_email_appointment_id": appointmentId_1.toString(),
                            "custscript_mw_send_email_processed_appt": false
                        }
                    }).submit();
                    log.debug("Success on creating Task", "Task created for the scheduled script with appointmentid " + appointmentId_1);
                }
            }
            else {
                log.error("After Submit Error", "No id found for the appointment");
            }
        }
        catch (pError) {
            log.error("After Submit Error", "Error = " + pError);
        }
    }
    exports.afterSubmit = afterSubmit;
});
