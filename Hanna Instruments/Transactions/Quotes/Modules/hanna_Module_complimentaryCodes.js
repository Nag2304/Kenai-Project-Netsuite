/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name: hanna_Module_complimentaryCodes.js
 * Author           Date       Version               Remarks
 * nagendrababu  02.18.2025      1.00        Initial creation of the script
 *
 */

/* global define,log */

define(['N/search'], function (search) {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ----------------------- Complimentary Codes - Begin ---------------------- */
  function complimentaryCodes(context) {
    var loggerTitle = ' Complimentary Codes ';
    try {
      var currentRecord = context.currentRecord;
      var sublistId = context.sublistId;

      // Ensure we are working on the 'item' field in the 'item' sublist
      if (sublistId === 'item') {
        var lineCount = currentRecord.getLineCount({ sublistId: 'item' });
        if (lineCount === 0) return;

        var primaryItemId = currentRecord.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'item',
        });

        if (!primaryItemId) {
          return;
        }

        // Check if customer is excluded from complimentary items
        var excludeComplimentary = currentRecord.getValue({
          fieldId: 'custbody_exclude_complimentary',
        });
        if (excludeComplimentary) {
          return;
        }

        // Lookup complimentary items from the custom table
        var complimentaryItems = getComplimentaryItems(primaryItemId);

        // Add complimentary items to the quote
        if (complimentaryItems.length > 0) {
          addComplimentaryItems(currentRecord, complimentaryItems);
        }
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
  }
  /* ------------------------ Complimentary Codes - End ----------------------- */
  //
  /* ------------------------ Helpers Functions - Begin ----------------------- */
  //
  /* *********************** Get Complimentary Items - Begin *********************** */
  function getComplimentaryItems(primaryItemId) {
    var complimentaryItems = [];

    var customRecordSearch = search.create({
      type: 'customrecord_hi_complimentary_codes',
      filters: [['custrecord_hi_primary_item', 'anyof', primaryItemId]],
      columns: [
        'custrecord_hi_comp_code_1',
        'custrecord_hi_comp_code_2',
        'custrecord_hi_comp_code_3',
        'custrecord_hi_comp_code_4',
        'custrecord_hi_comp_code_5',
        'custrecord_hi_comp_code_6',
        'custrecord_hi_comp_code_7',
        'custrecord_hi_comp_code_8',
        'custrecord_hi_comp_code_9',
        'custrecord_hi_comp_code_10',
        'custrecord_hi_comp_code_11',
        'custrecord_hi_comp_code_12',
      ],
    });

    customRecordSearch.run().each(function (result) {
      for (var i = 1; i <= 12; i++) {
        var compItem = result.getValue('custrecord_hi_comp_code_' + i);
        if (compItem) {
          complimentaryItems.push(compItem);
        }
      }
      return false; // Only one matching record is expected per primary item
    });

    return complimentaryItems;
  }
  /* *********************** Get Complimentary Items - End *********************** */
  //
  /* *********************** Add Complimentary Items - Begin *********************** */
  function addComplimentaryItems(currentRecord, complimentaryItems) {
    var loggerTitle = 'Add Complimentary Items';

    log.debug(
      loggerTitle,
      'Initial Line Count: ' + currentRecord.getLineCount({ sublistId: 'item' })
    );
    log.debug(
      loggerTitle,
      'Complimentary Items: ' + JSON.stringify(complimentaryItems)
    );

    complimentaryItems.forEach(function (itemId) {
      var exists = false;
      var lineCount = currentRecord.getLineCount({ sublistId: 'item' }); // Update line count dynamically

      // Check if the item already exists in the quote
      for (var i = 0; i < lineCount; i++) {
        var existingItem = currentRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          line: i,
        });
        if (existingItem == itemId) {
          exists = true;
          break;
        }
      }

      if (!exists) {
        log.debug(loggerTitle, 'Adding item: ' + itemId);
        currentRecord.selectNewLine({ sublistId: 'item' }); // Select new line
        currentRecord.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          value: itemId,
          ignoreFieldChange: true,
        });
        currentRecord.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'quantity',
          value: 1,
          ignoreFieldChange: true,
        });

        // Retrieve rate and calculate amount
        var rate =
          currentRecord.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
          }) || 0;
        var amount = rate * 1; // quantity is always 1
        log.debug(loggerTitle, 'Rate: ' + rate + ', Amount: ' + amount);

        currentRecord.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'amount',
          value: amount,
          ignoreFieldChange: true,
        });

        currentRecord.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'taxcode',
          value: '79279',
          ignoreFieldChange: true,
        });

        currentRecord.commitLine({ sublistId: 'item' }); // Commit the new line
      }
    });

    log.debug(
      loggerTitle,
      'Final Line Count: ' + currentRecord.getLineCount({ sublistId: 'item' })
    );
  }

  /* *********************** Add Complimentary Items - End *********************** */
  //
  /* ------------------------- Helpers Functions - End ------------------------ */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.sublistChanged = complimentaryCodes;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
