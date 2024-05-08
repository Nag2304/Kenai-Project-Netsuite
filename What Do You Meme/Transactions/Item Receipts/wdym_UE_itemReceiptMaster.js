/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

/*global define, log*/

/**
 * File Name: wdym_UE_itemReceiptMaster.js
 * Date                Version        Author               Description
 * 06 June 2023         1.00       Mike Williams      Created Master Script
 */

/*global define,log*/

define(['N/search', 'N/record', 'N/email'], (search, record, email) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* --------------------------- Before Load - Begin -------------------------- */
  const beforeLoad = (context) => {
    const loggerTitle = 'Before Load';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + '- Entry-------------------<| '
    );
    //
    try {
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + '- Exit-------------------<| '
    );
  };
  /* ---------------------------- Before Load - End --------------------------- */
  //
  /* -------------------------- Before Submit - Begin ------------------------- */
  const beforeSubmit = (context) => {
    const loggerTitle = 'Before Submit';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + '- Entry-------------------<| '
    );
    //
    try {
      const itemReceiptRecord = context.newRecord;
      //
      const itemReceiptLineCount = itemReceiptRecord.getLineCount({
        sublistId: 'item',
      });
      for (let index = 0; index < itemReceiptLineCount; index++) {
        const item = itemReceiptRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          line: index,
        });

        const itemType = itemReceiptRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'itemtype',
          line: index,
        });

        const quantity = itemReceiptRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'quantity',
          line: index,
        });

        const location = itemReceiptRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'location',
          line: index,
        });

        // Location is TBF (or) WHQ:LA
        if (
          itemType == 'InvtPart' &&
          (location === '1' || location === '115')
        ) {
          const inventoryItemSearch = search.lookupFields({
            type: search.Type.INVENTORY_ITEM,
            id: item,
            columns: ['custitem_sample_box', 'itemid'],
          });

          const sampleBox = inventoryItemSearch.custitem_sample_box;
          const itemId = inventoryItemSearch.itemid;

          if (sampleBox) {
            if (quantity < 100) {
              email.send({
                author: parseInt(8114),
                recipients: 'zack@relatable.com',
                subject: 'New Sample Arrival',
                body: 'An order of Samples has Arrived for ' + itemId,
              });
              //
              log.debug(loggerTitle, 'Email Sent for Quantity Less than 100');
            } else if (quantity > 100) {
              record.submitFields({
                type: record.Type.INVENTORY_ITEM,
                id: item,
                values: {
                  custitem_sample_box: false,
                },
              });
              //
              email.send({
                author: parseInt(8114),
                recipients: 'zack@relatable.com',
                subject: 'New Saleable Inventory',
                body: 'New Saleable Inventory has Arrived for ' + itemId,
              });
              //
              log.debug(
                loggerTitle,
                'Email Sent for Quantity Greater than 100'
              );
            }
          }
        }
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + '- Exit-------------------<| '
    );
  };
  /* --------------------------- Before Submit - End -------------------------- */
  //
  /* -------------------------- After Submit - Begin -------------------------- */
  const afterSubmit = (context) => {
    const loggerTitle = 'After Submit';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + '- Entry-------------------<| '
    );
    //
    try {
      if (context.type !== context.UserEventType.DELETE) {
        const itemReceiptRecordId = context.newRecord.id;

        const itemReceiptRecord = record.load({
          type: record.Type.ITEM_RECEIPT,
          id: itemReceiptRecordId,
        });

        const containerNumberItemReceipt = itemReceiptRecord.getValue({
          fieldId: 'custbody_wdym_container_number',
        });

        if (isEmpty(containerNumberItemReceipt)) {
          // Get Inbound Shipment Details
          const inboundShipmentRecordId = itemReceiptRecord.getValue({
            fieldId: 'inboundshipment',
          });
          if (!isEmpty(inboundShipmentRecordId)) {
            const inboundShipmentRecordSearch = search.lookupFields({
              type: search.Type.INBOUND_SHIPMENT,
              id: inboundShipmentRecordId,
              columns: ['custrecord_container_number'],
            });

            const containerNumber =
              inboundShipmentRecordSearch.custrecord_container_number;
            log.debug(loggerTitle, {
              inboundShipmentRecordId,
              containerNumber,
            });
            //

            // Save the Item Receipt Record Id
            if (!isEmpty(containerNumber)) {
              itemReceiptRecord.setValue({
                fieldId: 'custbody_wdym_container_number',
                value: containerNumber,
              });
              const irId = itemReceiptRecord.save();
              log.audit(
                loggerTitle,
                ' Item Receipt Record saved successfully ' + irId
              );
            }
            //
          }
        }
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + '- Exit-------------------<| '
    );
  };
  /* --------------------------- After Submit - End --------------------------- */
  //
  /* ------------------------ Helper Functions - Begin ------------------------ */
  //
  /* ************************** isEmpty - Begin ************************** */
  /**
   *
   * @param {String|Number} value
   * @returns {Boolean}
   */
  const isEmpty = (value) => {
    let returnValue = true;
    returnValue =
      value === null || value === undefined || value === 0 || value === '';
    return returnValue;
  };
  /* ************************** isEmpty - End ************************** */
  //
  /* ------------------------- Helper Functions - End ------------------------- */
  //
  /* ------------------------------ Exports - Begin ----------------------------- */
  exports.beforeLoad = beforeLoad;
  exports.beforeSubmit = beforeSubmit;
  exports.afterSubmit = afterSubmit;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
