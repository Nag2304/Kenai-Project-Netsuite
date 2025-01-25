/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */

/**
 * File name: scm_Module_setListPriceQuote.js
 * Author           Date       Version               Remarks
 * nagendrababu 01.23.2025      1.00     Initial creation of the script
 *
 */

/* global define,log */

define(['N/record'], (record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Set List Price - Begin ------------------------- */
  const setListPrice = (scriptContext) => {
    const loggerTitle = ' Set List Price ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' - Entry -------------------<|'
    );
    //
    try {
      // Ensure this logic only runs on create
      if (scriptContext.type !== 'create') {
        log.debug(loggerTitle, 'Skipping as the event type is not create.');
        return;
      }
      const quoteRecord = scriptContext.newRecord;
      const lineItemCount = quoteRecord.getLineCount({
        sublistId: 'item',
      });
      //
      for (let index = 0; index < lineItemCount; index++) {
        setLineItemListPrice(quoteRecord, index);
      }
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' - Exit -------------------<|'
    );
  };
  /* -------------------------- Set List Price - End -------------------------- */
  //
  /* ------------------------ Helper Functions - Begin ------------------------ */
  /**
   * Helper function to set the list price for a single line item.
   * @param {Record} quoteRecord - The Quote record.
   * @param {number} lineIndex - The line index of the item.
   */
  const setLineItemListPrice = (quoteRecord, lineIndex) => {
    const loggerTitle = 'Set Line Item List Price';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' - Entry -------------------<|'
    );
    //
    try {
      const itemId = quoteRecord.getSublistValue({
        sublistId: 'item',
        fieldId: 'item',
        line: lineIndex,
      });

      const itemType = quoteRecord.getSublistValue({
        sublistId: 'item',
        fieldId: 'itemtype',
        line: lineIndex,
      });

      let itemRecord;

      // Determine the appropriate record type based on the item type
      switch (itemType) {
        case 'Assembly':
          itemRecord = record.load({
            type: record.Type.ASSEMBLY_ITEM,
            id: itemId,
          });
          break;
        case 'InvtPart':
          itemRecord = record.load({
            type: record.Type.INVENTORY_ITEM,
            id: itemId,
          });
          break;
        case 'NonInvtPart':
          itemRecord = record.load({
            type: record.Type.NON_INVENTORY_ITEM,
            id: itemId,
          });
          break;
        case 'Kit':
          itemRecord = record.load({
            type: record.Type.KIT_ITEM,
            id: itemId,
          });
          break;
        default:
          log.debug(
            loggerTitle,
            `Unsupported item type for item ID: ${itemId}`
          );
          return;
      }

      const basePrice = itemRecord.getSublistValue({
        sublistId: 'price1',
        fieldId: 'price_1_',
        line: 0, // Base price is generally the first price level
      });

      log.debug(loggerTitle, `Base Price for item ${itemId}: ${basePrice}`);

      // Set the custom field on the sales order line
      quoteRecord.setSublistValue({
        sublistId: 'item',
        fieldId: 'custcol_scm_list_price',
        line: lineIndex,
        value: basePrice || 0, // Default to 0 if no base price is found
      });
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' - Exit -------------------<|'
    );
  };
  /* ------------------------ Helper Functions - End ------------------------ */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = setListPrice;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
