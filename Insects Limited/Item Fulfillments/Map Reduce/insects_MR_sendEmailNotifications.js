/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: insects_MR_sendEmailNotifications.js
 * Script: Insects | MR Send Email Notifications
 * Author           Date       Version               Remarks
 * nagendrababu  19th Aug 2024  1.00         Initial creation of the script.
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */

/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/search', 'N/email', 'N/record', 'N/runtime'], (
  search,
  email,
  record,
  runtime
) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    return search.create({
      type: 'itemfulfillment',
      settings: [{ name: 'consolidationtype', value: 'ACCTTYPE' }],
      filters: [
        ['type', 'anyof', 'ItemShip'],
        'AND',
        ['item', 'noneof', '@NONE@'],
        'AND',
        ['quantity', 'greaterthan', '0'],
        'AND',
        ['trandate', 'within', 'today'],
        'AND',
        ['unit', 'noneof', '@NONE@'],
      ],
      columns: [
        search.createColumn({ name: 'tranid', label: 'Document Number' }),
        search.createColumn({ name: 'item', label: 'Item' }),
        search.createColumn({ name: 'quantity', label: 'Quantity' }),
        search.createColumn({
          name: 'custitem_il_prod_page_link',
          join: 'item',
          label: 'Product Page Link',
        }),
        search.createColumn({
          name: 'lineuniquekey',
          label: 'Line Unique Key',
        }),
        search.createColumn({
          name: 'otherrefnum',
          join: 'createdFrom',
          label: 'PO/Check Number',
        }),
        search.createColumn({
          name: 'trackingnumbers',
          label: 'Tracking Numbers',
        }),
        search.createColumn({
          name: 'custbody_il_ship_email',
          join: 'createdFrom',
          label: 'Shipment Email',
        }),
      ],
    });
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* -------------------------- Map Phase - Begin -------------------------- */
  /**
   *
   * @param {object} reduceContext
   */
  const map = (mapContext) => {
    const loggerTitle = 'Map Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      // Read & parse the data
      const searchResult = JSON.parse(mapContext.value);
      log.debug(loggerTitle + ' After Parsing Results', searchResult);
      log.debug(
        loggerTitle + ' After Parsing Results Values',
        searchResult.values
      );
      //
      /* ---------------------- Form Key Value Pairs - Begin ---------------------- */
      const key = searchResult.values.tranid;
      log.debug(loggerTitle, ' Key: ' + key);
      //
      const values = {};
      values.sku = searchResult.values.item.text;
      values.quantity = searchResult.values.quantity;
      values.prodPageLinkItem =
        searchResult.values['custitem_il_prod_page_link.item'];
      values.trackingNumber = searchResult.values.trackingnumbers;
      values.otherRefNum = searchResult.values['otherrefnum.createdFrom'];
      values.shipmentEmail =
        searchResult.values['custbody_il_ship_email.createdFrom'];
      // Write Key & Values
      mapContext.write({
        key: key,
        value: values,
      });
      log.debug(loggerTitle + '  Value Pairs', values);
      //
      /* ---------------------- Form Key Value Pairs - End ---------------------- */
      //
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* -------------------------- Map Phase - End -------------------------- */
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
    let emailBody = '';
    try {
      // Retrieve Script Parameter - From and To Email Address
      const scriptObj = runtime.getCurrentScript();
      const fromEmailAddress = scriptObj.getParameter({
        name: 'custscript_ins_from_emal_addrs',
      });
      //

      // Key
      const tranId = reduceContext.key;
      //

      // Read Values
      const values = reduceContext.values;
      const eachValue = JSON.parse(values[0]);
      const poCheckNumber = eachValue.otherRefNum;
      const trackingNumber = eachValue.trackingNumber;
      let toEmailAddress = eachValue.shipmentEmail
        ? eachValue.shipmentEmail
        : scriptObj.getParameter({
            name: 'custscript_ins_to_emal_addr',
          });
      log.debug(loggerTitle + ' Emails', { fromEmailAddress, toEmailAddress });
      //
      for (let index = 0; index < values.length; index++) {
        const result = JSON.parse(values[index]);
        log.debug(loggerTitle + ' for loop', result);
        //
        emailBody += `SKU: ${result.sku} Qty: ${result.quantity} Link: ${result.prodPageLinkItem}`;
        emailBody += '\n';
      }
      //
      // Load the Email Template
      const emailTemplate = record.load({
        type: record.Type.EMAIL_TEMPLATE,
        id: 20,
      });
      let content = emailTemplate.getValue({ fieldId: 'content' });
      content = content.replace('{tranid}', tranId);
      content = content.replace('{otherrefnum}', poCheckNumber);
      content = content.replace('{linkedtrackingnumbers}', trackingNumber);
      content += emailBody;
      const subject = emailTemplate.getValue({ fieldId: 'subject' });
      //

      let userId = runtime.getCurrentUser().id;
      if (userId === -4 || userId === '-4') {
        userId = fromEmailAddress;
      }
      email.send({
        author: parseInt(userId),
        recipients: toEmailAddress,
        subject: subject,
        body: content,
      });
      log.debug(
        loggerTitle + ' Email Sent Successfully',
        `RECEIPIENT EMAIL ADDRESS : ${toEmailAddress}`
      );
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
  exports.map = map;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
