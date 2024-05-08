/**
 * @NAPIVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @author Midware
 * @Website www.midware.net
 * @Developer Sergio Tijerino
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log", "N/search", "N/record", "N/email", "../Global/Constants"], function (require, exports, log, search, record, email, CONSTANTS) {
    Object.defineProperty(exports, "__esModule", { value: true });
    /* Before Load Method */
    function afterSubmit(pContext) {
        log.debug("User event type", pContext.type + "-- appintment id" + pContext.newRecord.id);
        try {
            if (pContext.type == pContext.UserEventType.CREATE) {
                var searchResults = search.lookupFields({ type: "supportcase", id: pContext.newRecord.id.toString(), columns: ["custevent_property"] });
                log.debug("Support case id ***", pContext.newRecord.id.toString());
                log.debug("propertyId", searchResults["custevent_property"][0].value);
                var propertyId = searchResults["custevent_property"][0].value;
                var propertyRecord = record.load({ id: propertyId, type: "customrecord_property_record" });
                //Send email if the property listed is GHOST TYPE
                //Delete this            AND               Uncomment this when ready for production
                if (10132 == propertyId /*&& CONSTANTS.LISTING_TYPE.GHOST_LISTING == Number(propertyRecord.getValue("custrecord_listing_type")) */) {
                    var emailBody = getEmailBody(propertyRecord);
                    log.debug("email body", emailBody);
                    sendEmail(emailBody);
                    log.debug("*EMail Sended because Property Record* =", propertyId + "  of appointment  " + pContext.newRecord.id.toString());
                }
            }
        }
        catch (error) {
            log.debug("After Submit Method - Error ", "Error : " + error);
        }
    }
    exports.afterSubmit = afterSubmit;
    function getEmailBody(pPropertyRecord) {
        try {
            var propertyRecord = pPropertyRecord;
            var similarPropertiesBody = "";
            var price = Number(propertyRecord.getValue("custrecord_current_list_price"));
            var subdivisionName = propertyRecord.getValue("custrecordcustrecordsubdname");
            var minimumPrice = price - (price * CONSTANTS.MINIMUM_PERCENTAGE);
            var maximumPrice = price + (price * CONSTANTS.MAXIMUM_PERCENTAGE);
            log.debug("Params", "price " + price + ", minimun " + minimumPrice + ", maximum " + maximumPrice + ", subdivision " + subdivisionName);
            var searchObj = search.create({
                type: "customrecord_property_record",
                filters: [
                    ["internalid", "noneof", propertyRecord.id],
                    "AND",
                    ["custrecordcustrecordsubdname", "anyof", subdivisionName],
                    "AND",
                    ["custrecord_current_list_price", "between", minimumPrice, maximumPrice],
                ],
                columns: [
                    search.createColumn({
                        name: "name",
                        sort: search.Sort.ASC
                    }),
                    "internalid",
                    "custrecord_house_number",
                    "custrecord31",
                    "custrecordcustrecordsubdname"
                ]
            });
            searchObj.run().each(function setBody(results) {
                log.debug("IN HERE", JSON.stringify(results));
                similarPropertiesBody += "* Id of property: " + results.getValue("internalid") + "\n";
                similarPropertiesBody += "House Number of property: " + results.getValue("custrecord_house_number") + "\n";
                similarPropertiesBody += "Street of property: " + results.getText("custrecord31") + "\n";
                similarPropertiesBody += "Subdivision of property: " + results.getText("custrecordcustrecordsubdname") + "\n\n";
                return true;
            });
            if (similarPropertiesBody == "") {
                similarPropertiesBody = "There are no similar properties";
            }
            return similarPropertiesBody;
        }
        catch (pError) {
            log.debug("Error on getEmailBody", "Error : " + pError);
        }
    }
    function sendEmail(pBody) {
        try {
            log.debug("Send Email method", "Attempting to send email");
            email.send({
                author: -5,
                recipients: ["fernanda.carmona@midware.net"],
                subject: "Test Email to Builder",
                body: pBody
            });
            log.debug("Send Email method", "Email successfully sent");
        }
        catch (pError) {
            log.debug("Error at sendEmail", "Error : " + pError);
        }
    }
});
