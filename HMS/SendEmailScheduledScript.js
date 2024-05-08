/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 * @author Midware
 * @Website www.midware.net
 * @Developer Sergio Tijerino
 * @contact contact@midware.net
 */
define(["require", "exports", "N/runtime", "N/log", "../Global/LibrarySendEmail", "../Global/Constants"], function (require, exports, runtime, log, LIBRARY, CONSTANTS) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function execute(pContext) {
        log.debug("Execute", "Start of function");
        var appointmentId = runtime.getCurrentScript().getParameter({ name: "custscript_mw_send_email_appointment_id" });
        log.debug("Processing Appointent", "Appointment ID = " + appointmentId);
        //No id means error
        if (CONSTANTS.CHECKVALUE(appointmentId)) {
            //Checks if you already retrieved all builders, linked and no linked appointments for the appointment
            var processedAppointment = runtime.getCurrentScript().getParameter({ name: "custscript_mw_send_email_processed_appt" });
            log.debug("Appointment id Processed", "Appointment processed = " + processedAppointment);
            //Gather all related appointments (if there are any) to the appointment
            if (!processedAppointment) {
                LIBRARY.processAppointment(appointmentId);
            }
            //When all related appointments are together, (if there are) then process each one and send the email
            //otherwise, just process the original appointment id
            else if (processedAppointment) {
                //Array of appointments that are not linked, usually only the original appointment
                var noLinkedCases = JSON.parse(runtime.getCurrentScript().getParameter({ name: "custscript_mw_send_email_no_linked_cases" }).toString());
                //Index of the array where the last element was proccessed
                var noLinkedCasesIndex = runtime.getCurrentScript().getParameter({ name: "custscript_mw_send_email_n_inked_cs_idx" });
                //Linked appointments array, bases on their linked case number
                var linkedCases = JSON.parse(runtime.getCurrentScript().getParameter({ name: "custscript_mw_send_email_linked_cases" }).toString());
                //Step of the process where it was last being executed
                var currentStep = runtime.getCurrentScript().getParameter({ name: "custscript_mw_current_step" });
                //Information inside the email template
                var emailMergeData = runtime.getCurrentScript().getParameter({ name: "custscript_mw_email_merge_data" });
                if (" " != emailMergeData) {
                    emailMergeData = JSON.parse(emailMergeData.toString());
                }
                //Information related to the appointment
                var caseData = runtime.getCurrentScript().getParameter({ name: "custscript_mw_case_data" });
                if (" " != caseData) {
                    caseData = JSON.parse(caseData.toString());
                }
                //Builders emails that are needed to be send an email
                var bsrEmails = runtime.getCurrentScript().getParameter({ name: "custscript_mw_bsr_emails" });
                if (" " != bsrEmails) {
                    bsrEmails = JSON.parse(bsrEmails.toString());
                }
                //Information related to the partner on the Appointment
                var partnerData = runtime.getCurrentScript().getParameter({ name: "custscript_mw_partner_data" });
                if (" " != partnerData) {
                    partnerData = JSON.parse(partnerData.toString());
                }
                /*
                //Not used inside
                let emailSentData = runtime.getCurrentScript().getParameter({ name : "custscript_mw_email_sent_data"});
                if(" " != emailSentData){
                    emailSentData = JSON.parse(emailMergeData.toString());
                } */
                log.debug("No linked Cases", noLinkedCases);
                log.debug("No linked Cases Index", noLinkedCasesIndex);
                log.debug("Linked Cases", linkedCases);
                log.debug("Current Step", currentStep);
                log.debug("Email Merge data", emailMergeData);
                log.debug("Case Data", caseData);
                log.debug("Bsr Emails", bsrEmails);
                log.debug("Partner Data", partnerData);
                log.debug("On Scheduled Script Execute", "About to start the process of the Cases");
                LIBRARY.processCases(appointmentId, noLinkedCases, noLinkedCasesIndex, linkedCases, currentStep, emailMergeData, caseData, bsrEmails, partnerData);
            }
            else {
                log.error("Schedule Script Execute", "Could not find current process phase");
            }
        }
        else {
            log.debug("Scheduled Script Execute", "No appointment id found");
        }
    }
    exports.execute = execute;
});
