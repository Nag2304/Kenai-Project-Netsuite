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
    //Suitescript MR Email Notification Shipments (Saved Search)
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
        ['unit', 'noneof', '@NONE@'],
        'AND',
        ['createdfrom.custbody_insects_email_sent', 'is', 'F'],
        'AND',
        ['trandate', 'within', 'today'],
      ],
      columns: [
        search.createColumn({ name: 'tranid', label: 'Document Number' }),
        search.createColumn({ name: 'item', label: 'Item' }),
        search.createColumn({ name: 'trandate', label: 'Date' }),
        search.createColumn({ name: 'quantity', label: 'Quantity' }),
        search.createColumn({
          name: 'trackingnumbers',
          label: 'Tracking Numbers',
        }),
        search.createColumn({
          name: 'otherrefnum',
          join: 'createdFrom',
          label: 'PO/Check Number',
        }),
        search.createColumn({
          name: 'custbody_il_ship_email',
          join: 'createdFrom',
          label: 'Shipment Email',
        }),
        search.createColumn({
          name: 'custitem_il_prod_page_link',
          join: 'item',
          label: 'Product Page Link',
        }),
        search.createColumn({
          name: 'internalid',
          join: 'createdFrom',
          label: 'Internal ID',
        }),
        search.createColumn({
          name: 'tranid',
          join: 'createdFrom',
          label: 'Document Number',
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
      values.ifDate = searchResult.values.trandate;
      values.sku = searchResult.values.item.text;
      values.quantity = searchResult.values.quantity;
      values.prodPageLinkItem =
        searchResult.values['custitem_il_prod_page_link.item'];
      values.trackingNumber = searchResult.values.trackingnumbers;
      values.otherRefNum = searchResult.values['otherrefnum.createdFrom'];
      values.shipmentEmail =
        searchResult.values['custbody_il_ship_email.createdFrom'];
      values.createdFromInternalId =
        searchResult.values['internalid.createdFrom'].value;
      values.createdFromTranId = searchResult.values['tranid.createdFrom'];
      values.ifId = searchResult.id;
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
      // Retrieve Script Parameter - User ID (Email Address)
      const scriptObj = runtime.getCurrentScript();
      const fromEmailAddress = scriptObj.getParameter({
        name: 'custscript_ins_from_emal_addrs',
      });
      //

      // Read Values
      const values = reduceContext.values;
      const eachValue = JSON.parse(values[0]);
      const tranId = eachValue.createdFromTranId;
      const poCheckNumber = eachValue.otherRefNum;
      const trackingNumber = eachValue.trackingNumber;
      const ifDate = eachValue.ifDate;

      log.debug(loggerTitle, ' IF Date: ' + ifDate);

      let toEmailAddress = eachValue.shipmentEmail
        ? eachValue.shipmentEmail
        : scriptObj.getParameter({
            name: 'custscript_ins_to_emal_addr',
          });
      log.debug(loggerTitle + ' Emails', { fromEmailAddress, toEmailAddress });
      //

      // Retrieve Email Template
      const emailTemplateId = scriptObj.getParameter({
        name: 'custscript_insects_email_template',
      });
      const logoTemplateId = scriptObj.getParameter({
        name: 'custscript_insects_logo_template',
      });
      //

      // If Script Parameters of Templates are not empty.
      if (emailTemplateId && logoTemplateId) {
        // Load the Email Template
        const emailTemplate = record.load({
          type: record.Type.EMAIL_TEMPLATE,
          id: emailTemplateId,
        });

        // Build Email Body
        let content = emailTemplate.getValue({ fieldId: 'content' });
        content = content.replace('{tranid}', tranId);
        content = content.replace('{otherrefnum}', poCheckNumber);
        // Determine public carrier tracking link if possible
        let trackingUrl = getCarrierTrackingUrl(trackingNumber);

        // If no public link found, fallback to NetSuite tracker using trackingnumberkey
        if (!trackingUrl) {
          const trackingNumberKey = getTrackingNumberKey(
            eachValue.ifId,
            trackingNumber
          );
          if (trackingNumberKey) {
            trackingUrl =
              'https://5749557.app.netsuite.com/app/common/shipping/packagetracker.nl?id=' +
              trackingNumberKey;
          }
        }

        // Replace token in email template
        content = content.replace(
          '{linkedtrackingnumbers}',
          `<a href="${trackingUrl}" target="_blank">${trackingNumber}</a>`
        );

        content = content.replace('{actualshipdate}', ifDate);
        let emailBody =
          '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">';
        emailBody +=
          '<tr><th>SKU</th><th>Quantity</th><th>Product Detail</th></tr>';

        for (let index = 0; index < values.length; index++) {
          const result = JSON.parse(values[index]);
          log.debug(loggerTitle + ' for loop', result);

          emailBody += '<tr>';
          emailBody += `<td>${result.sku}</td>`;
          emailBody += `<td>${result.quantity}</td>`;
          emailBody += `<td><a href="${result.prodPageLinkItem}">View Product</a></td>`;
          emailBody += '</tr>';
        }
        emailBody += '</table>';
        content += emailBody;
        content += '<br/><br/><br/><br/>';
        //

        // Email Subject
        const subject = emailTemplate.getValue({ fieldId: 'subject' });
        //

        // Retrieve Logo Information
        const logoTemplate = record.load({
          type: record.Type.EMAIL_TEMPLATE,
          id: logoTemplateId,
        });
        content += logoTemplate.getValue({ fieldId: 'content' });
        //

        log.debug(loggerTitle + ' Email Content', content);

        let userId = runtime.getCurrentUser().id;
        if (userId === -4 || userId === '-4') {
          userId = fromEmailAddress;
        }

        log.debug(
          loggerTitle,
          `UserId:${userId}, Recipients: ${toEmailAddress} Subject: ${subject}`
        );

        // Send Email
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
        //

        // Email Sent Successfully
        record.submitFields({
          type: record.Type.SALES_ORDER,
          id: eachValue.createdFromInternalId,
          values: {
            custbody_insects_email_sent: true,
          },
        });
        log.debug(
          loggerTitle,
          ' Email Sent successfully for the sales order: ' +
            eachValue.createdFromInternalId
        );
      } else {
        log.error(
          loggerTitle,
          ' Missing Template Parameters on the script deployment record.'
        );
      }

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
  /**
   * Retrieves the trackingnumberkey from the package sublist by matching trackingNumber.
   * @param {number} ifId - Internal ID of the Item Fulfillment record.
   * @param {string} trackingNumber - Tracking number to match.
   * @returns {string|null} trackingnumberkey or null if not found.
   */
  const getTrackingNumberKey = (ifId, trackingNumber) => {
    const loggerTitle = 'Get Tracking Number Key';
    log.debug(loggerTitle, `|>---- ${loggerTitle} - Entry ----<|`);
    let trackingNumberKey = null;

    try {
      const ifRec = record.load({
        type: record.Type.ITEM_FULFILLMENT,
        id: ifId,
        isDynamic: false,
      });

      const lineCount = ifRec.getLineCount({ sublistId: 'package' });

      for (let i = 0; i < lineCount; i++) {
        const pkgTrackingNum = ifRec.getSublistValue({
          sublistId: 'package',
          fieldId: 'trackingnumber',
          line: i,
        });

        if (pkgTrackingNum && pkgTrackingNum === trackingNumber) {
          trackingNumberKey = ifRec.getSublistValue({
            sublistId: 'package',
            fieldId: 'trackingnumberkey',
            line: i,
          });
          break;
        }
      }
    } catch (error) {
      log.error(loggerTitle, error);
    }

    log.debug(loggerTitle, `Tracking Number Key found: ${trackingNumberKey}`);
    log.debug(loggerTitle, `|>---- ${loggerTitle} - Exit ----<|`);
    return trackingNumberKey;
  };

  /**
   * Returns the carrier tracking URL based on tracking number prefix or pattern.
   * @param {string} trackingNumber
   * @returns {string|null} Fully qualified tracking URL or null if no match.
   */
  const getCarrierTrackingUrl = (trackingNumber) => {
    if (!trackingNumber) return null;

    const tn = trackingNumber.trim().toUpperCase();

    // UPS: starts with 1Z
    if (tn.startsWith('1Z')) {
      return `https://www.ups.com/track?tracknum=${encodeURIComponent(tn)}`;
    }

    // FedEx: Numeric (12, 15, or 20 digits)
    if (/^\d{12}$/.test(tn) || /^\d{15}$/.test(tn) || /^\d{20}$/.test(tn)) {
      return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(
        tn
      )}`;
    }

    // USPS: 20–22 digits or certain starting codes
    if (/^\d{20,22}$/.test(tn) || /^(94|93|92|94|70|23|03)/.test(tn)) {
      return `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${encodeURIComponent(
        tn
      )}`;
    }

    // DHL: starts with 3S, JVGL, or 10-digit numeric
    if (/^(3S|JVGL)/.test(tn) || /^\d{10}$/.test(tn)) {
      return `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(
        tn
      )}&brand=DHL`;
    }

    return null; // No match found
  };

  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.getInputData = getInputData;
  exports.map = map;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
