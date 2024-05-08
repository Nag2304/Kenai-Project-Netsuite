/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: coterie_MR_automaticEmails.js
 * Script: Coterie | MR Automatic Emails
 * Author           Date       Version               Remarks
 * mikewilliams  09.16.2023    1.00       Initial Creation Of the Script
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */

/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/record', 'N/search', 'N/runtime', 'N/format', 'N/email'], (
  record,
  search,
  runtime,
  format,
  email
) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    return search.create({
      type: 'salesorder',
      filters: [
        ['type', 'anyof', 'SalesOrd'],
        'AND',
        ['status', 'anyof', 'SalesOrd:B'],
        'AND',
        ['custbody_coterie_emails_sent', 'is', 'F'],
        'AND',
        ['mainline', 'is', 'T'],
        'AND',
        ['customer.custentity_coterie_emailautomation', 'is', 'T'],
      ],
      columns: [
        search.createColumn({ name: 'tranid', label: 'Document Number' }),
        search.createColumn({ name: 'location', label: 'Location' }),
        search.createColumn({ name: 'custbody1', label: 'Pick Up Date' }),
        search.createColumn({
          name: 'altname',
          join: 'customer',
          label: 'Name',
        }),
        search.createColumn({ name: 'otherrefnum', label: 'PO#' }),
        search.createColumn({ name: 'trandate', label: 'Date' }),
      ],
    });
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* -------------------------- Reduce Phase - Begin -------------------------- */
  /**
   *
   * @param {object} reduceContext
   */
  const reduce = (reduceContext) => {
    const loggerTitle = 'Reduce Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const scriptObj = runtime.getCurrentScript();
      let emailSent = false;

      // Retrieve Key & values.
      const key = reduceContext.key;
      const results = JSON.parse(reduceContext.values[0]);
      log.debug(loggerTitle, ' KEY: ' + key);
      log.debug(loggerTitle + ' After Parsing Results', results);
      //

      // Retrieve the Document Number
      const salesOrderDocumentNumber = results.values.tranid;
      // Retrieve Location
      const salesOrderLocation = results.values.location.value;
      // Retrieve Date Time
      const pickUpDate = results.values.custbody1;
      // Retrieve Customer Name
      const customerCompanyName = results.values['altname.customer'];
      // Retrieve PO#
      const poNumber = results.values.otherrefnum;
      // Retrieve Date
      const date = results.values.trandate;

      log.debug(loggerTitle + ' Values', {
        salesOrderDocumentNumber,
        salesOrderLocation,
        pickUpDate,
        customerCompanyName,
        poNumber,
        date,
      });

      // Check the custom record type
      if (salesOrderLocation) {
        const coteireSearchByLocation = search.create({
          type: 'customrecord_coterie_emailaddr_by_locati',
          filters: [
            ['isinactive', 'is', 'F'],
            'AND',
            ['custrecord_coterie_eabl_email_address', 'isnotempty', ''],
            'AND',
            ['custrecord_coterie_eabl_location', 'anyof', salesOrderLocation],
          ],
          columns: [
            search.createColumn({
              name: 'custrecord_coterie_eabl_email_address',
              label: 'Email Address',
            }),
          ],
        });
        //
        const searchResultCount = coteireSearchByLocation.runPaged().count;
        log.debug(loggerTitle, ' Search By Location: ' + searchResultCount);

        if (searchResultCount > 0) {
          // Run the search
          coteireSearchByLocation.run().each(function (result) {
            // Retrieve email
            const emailAddress = result.getValue({
              name: 'custrecord_coterie_eabl_email_address',
              label: 'Email Address',
            });
            log.debug(loggerTitle, 'Email Address: ' + emailAddress);

            // Frame the email template
            let date;
            if (pickUpDate) {
              date = format.format({
                value: pickUpDate,
                type: format.Type.DATETIMETZ,
              });
            }

            let userId = runtime.getCurrentUser().id;
            if (userId === -4 || userId === '-4') {
              userId = scriptObj.getParameter({
                name: 'custscript_coterie_emailauthor',
              });
            }

            const emailSubject = `UNFI ${customerCompanyName} PO# ${poNumber} // ${salesOrderDocumentNumber}  Pick Up ${pickUpDate}`;

            // Email Body
            const emailTemplate = record.load({
              type: record.Type.EMAIL_TEMPLATE,
              id: 9,
            });
            let emailBody = emailTemplate.getValue({ fieldId: 'content' });

            emailBody = emailBody.replace(
              '{transaction.customername}',
              customerCompanyName
            );
            emailBody = emailBody.replace(
              '{transaction.otherrefnum}',
              poNumber
            );
            emailBody = emailBody.replace(
              '{transaction.tranid}',
              salesOrderDocumentNumber
            );
            emailBody = emailBody.replace('{transaction.trandate}', date);
            //

            log.debug(
              loggerTitle,
              ` User ID: ${userId} Email Subject: ${emailSubject} Email Body:${emailBody}`
            );

            email.send({
              author: parseInt(userId),
              recipients: emailAddress,
              subject: emailSubject,
              body: emailBody,
            });
            log.debug(
              loggerTitle + ' Email Sent Successfully',
              `RECEIPIENT EMAIL ADDRESS : ${emailAddress}`
            );

            // Create the Email Message
            const messageRecord = record.create({ type: record.Type.MESSAGE });
            messageRecord.setValue({
              fieldId: 'subject',
              value: emailSubject,
            });
            messageRecord.setValue({
              fieldId: 'message',
              value: emailBody,
            });
            messageRecord.setValue({
              fieldId: 'recipientemail',
              value: emailAddress,
            });
            messageRecord.setValue({
              fieldId: 'author',
              value: userId,
            });
            messageRecord.setValue({
              fieldId: 'transaction',
              value: key,
            });
            const messageId = messageRecord.save();
            log.debug(
              loggerTitle,
              'Message created successfully: ' + messageId
            );
            //
            emailSent = true;
            return true;
          });
          //

          // Update Sales Order Record
          if (emailSent) {
            record.submitFields({
              type: record.Type.SALES_ORDER,
              id: key,
              values: {
                custbody_coterie_emails_sent: true,
              },
            });
            log.debug(
              loggerTitle + ' Sales Record Updated Successfully',
              `SALES ORDER INTERNAL ID:${key}`
            );
          }
          //
        } else {
          log.debug(
            loggerTitle,
            `Sales Order Location ${salesOrderLocation} not present in the Custom table Coteire Email Address By Location`
          );
        }
      }
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* --------------------------- Reduce Phase - End --------------------------- */
  //
  /* ------------------------- Summarize Phase - Begin ------------------------ */
  /**
   *
   * @param {object} summarizeContext
   */
  const summarize = (summarizeContext) => {
    const loggerTitle = 'Summarize Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      log.audit(
        loggerTitle + ' Usage',
        'Summary Usage: ' + summarizeContext.usage
      );
      log.audit(
        loggerTitle + ' Concurrency',
        'Summary Concurrency: ' + summarizeContext.concurrency
      );
      log.audit(
        loggerTitle + ' Yields',
        'Summary Yields: ' + summarizeContext.yields
      );
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* ------------------------- Summarize Phase - End ------------------------ */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.getInputData = getInputData;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
