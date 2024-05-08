/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

/*global define,log*/

define(['N/email', 'N/record', 'N/runtime', 'N/search'], (
  email,
  record,
  runtime,
  search
) => {
  //
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
        ['mainline', 'is', 'T'],
        'AND',
        ['status', 'anyof', 'SalesOrd:G'],
        'AND',
        ['name', 'anyof', '6655'],
        'AND',
        ['custbody_wdym_sample_email_sent', 'is', 'F'],
        'AND',
        ['custbody_wdym_samples_email', 'isnotempty', ''],
      ],
      columns: [
        search.createColumn({ name: 'internalid', label: 'SO Internal ID' }),
        search.createColumn({
          name: 'custbody_wdym_samples_email',
          label: 'Samples Email',
        }),
        search.createColumn({
          name: 'trackingnumbers',
          label: 'Tracking Numbers',
        }),
        search.createColumn({ name: 'otherrefnum', label: 'PO/Check Number' }),
        search.createColumn({ name: 'tranid', label: 'Document Number' }),
      ],
    });
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ----------------------------- Reduce - Begin ----------------------------- */
  const reduce = (reduceContext) => {
    const strLoggerTitle = 'Reduce Phase';
    let emailBodyText = '';
    let receiverArr;
    try {
      // Retrieve Key & values.
      const key = reduceContext.key;
      const results = JSON.parse(reduceContext.values[0]);
      log.debug(strLoggerTitle + ' After Parsing Results', results);
      //
      // Retrieve Tracking Numbers from Item Fulfillment
      const trackingNumbersList = retrieveTrackingNumbers(key);
      const soTrackingNumber = results.values.trackingnumbers;
      const poNumber = results.values.otherrefnum;
      const soDocumentNumber = results.values.tranid;
      //
      // Get & Send Email
      const scriptObj = runtime.getCurrentScript();

      let userId = runtime.getCurrentUser().id;
      if (userId === -4 || userId === '-4') {
        userId = scriptObj.getParameter({
          name: 'custscript_wdym_emailauthor',
        });
      }
      const receiver = results.values.custbody_wdym_samples_email.split(',');
      if (Array.isArray(receiver) && receiver.length > 0) {
        receiverArr = receiver.map((email) => email.trim());
      }
      const emailSubject = scriptObj.getParameter({
        name: 'custscript_wdym_emailsubject',
      });
      //

      // Load the Email Template
      const emailTemplate = record.load({
        type: record.Type.EMAIL_TEMPLATE,
        id: 6,
      });
      let content = emailTemplate.getValue({ fieldId: 'content' });
      content = content.replace('{PONUMBER}', poNumber);
      content = content.replace('{DOCUMENTNUMBER}', soDocumentNumber);
      content = content.replace('{TRACKINGNUMBER}', soTrackingNumber);
      emailBodyText += content;
      //
      if (trackingNumbersList.length) {
        trackingNumbersList.forEach((value) => {
          emailBodyText += `<div><strong>${value.item} </strong>QUANTITY is ${value.quantity}.</div>`;
        });
      }
      const emailBody = emailBodyText;
      //
      log.debug(strLoggerTitle + ' Email Fields', `USER ID: ${userId}`);
      log.debug(strLoggerTitle + ' Email Body', `${emailBody}`);
      //
      email.send({
        author: parseInt(userId),
        recipients: receiverArr,
        subject: emailSubject,
        body: emailBody,
      });
      log.debug(
        strLoggerTitle + ' Email Sent Successfully',
        `RECEIPIENT EMAIL ADDRESS : ${receiverArr}`
      );

      //
      // Update Sales Order Record
      record.submitFields({
        type: record.Type.SALES_ORDER,
        id: key,
        values: {
          custbody_wdym_sample_email_sent: true,
        },
      });
      log.debug(
        strLoggerTitle + ' Sales Record Updated Successfully',
        `SALES ORDER INTERNAL ID:${key}`
      );
    } catch (err) {
      log.audit(strLoggerTitle + ' failed to execute', err);
    }
  };
  /* ------------------------------ Reduce - End ------------------------------ */
  //
  /* ------------------------- Summarize Phase - Begin ------------------------ */
  const summarize = (summarizeContext) => {
    const strLoggerTitle = 'Summarize Phase';
    try {
      log.audit(
        strLoggerTitle + ' Usage',
        'Summary Usage: ' + summarizeContext.usage
      );
      log.audit(
        strLoggerTitle + ' Concurrency',
        'Summary Concurrency: ' + summarizeContext.concurrency
      );
      log.audit(
        strLoggerTitle + ' Yields',
        'Summary Yields: ' + summarizeContext.yields
      );
    } catch (err) {
      log.audit(strLoggerTitle + ' failed to execute', err);
    }
  };
  /* ------------------------- Summarize Phase - End ------------------------ */
  //
  /* ----------------------- Internal Functions - Begin ----------------------- */
  //
  /* *********************** Retrieve Tracking Numbers - Begin ***********************/
  /**
   *
   * @param {number} internalId - Sales Order Internal ID.
   * @returns - collection of tracking numbers from the item fulfillment.
   */
  const retrieveTrackingNumbers = (internalId) => {
    const itemObjectArr = [];
    let itemObject = {};
    const itemfulfillmentSearchObj = search.create({
      type: 'itemfulfillment',
      filters: [
        ['type', 'anyof', 'ItemShip'],
        'AND',
        ['createdfrom.internalidnumber', 'equalto', internalId],
        'AND',
        ['item.type', 'anyof', 'InvtPart'],
      ],
      columns: [
        search.createColumn({
          name: 'custbody_tracking_number',
          label: 'Tracking Number',
        }),
        search.createColumn({
          name: 'displayname',
          join: 'item',
          label: 'Display Name',
        }),
        search.createColumn({ name: 'quantity', label: 'Quantity' }),
      ],
    });
    itemfulfillmentSearchObj.run().each(function (result) {
      itemObject.item = result.getValue({
        name: 'displayname',
        join: 'item',
        label: 'Display Name',
      });
      itemObject.quantity = result.getValue({
        name: 'quantity',
        label: 'Quantity',
      });
      itemObject.trackingNumbers = result.getValue({
        name: 'custbody_tracking_number',
        label: 'Tracking Number',
      });
      itemObjectArr.push(itemObject);
      itemObject = {};
      return true;
    });

    // Remove Duplicate items from the array of objects.
    const filteredObjectArray = itemObjectArr.reduce((acc, current) => {
      const x = acc.find(
        (item) => item.item === current.item && item.quantity > 0
      );
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);
    log.debug('Retrieve Tracking Numbers', filteredObjectArray);
    //

    return filteredObjectArray;
  };
  /* *********************** Retrieve Tracking Numbers - End ***********************/
  //
  /* ----------------------- Internal Functions - End ----------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.getInputData = getInputData;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
