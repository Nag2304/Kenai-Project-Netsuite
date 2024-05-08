/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
/**
 * File Name: dm_CS_purchaseOrderMaster.js
 * Date                Version        Author               Description
 * 06 June 2023         1.00       Mike Williams      Created Master Script for the Client
 */

/*global define,log*/

define([], function () {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ---------------------------- Validate Line Begin --------------------------- */
  function validateLine(context) {
    var loggerTitle = ' Validate Line ';
    log.audit(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Entry----------------<|'
    );
    //
    try {
      var currentRecord = context.currentRecord;
      var sublistId = context.sublistId;

      if (sublistId == 'item') {
        var itemId = currentRecord.getCurrentSublistValue({
          sublistId: sublistId,
          fieldId: 'item',
        });
      }
      if (itemId == '' || itemId == null || itemId == 'Nan') return true;

      var amount = currentRecord.getCurrentSublistValue({
        sublistId: 'item',
        fieldId: 'amount',
      });

      var boardFeet = currentRecord.getCurrentSublistValue({
        sublistId: 'item',
        fieldId: 'custcol_dm_po_board_feet',
      });

      if (boardFeet > 0 && amount > 0) {
        var boardLengthRate = amount / boardFeet;

        boardLengthRate = boardLengthRate.toFixed(3);

        currentRecord.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_dm_board_length_rate',
          value: boardLengthRate,
          ignoreFieldChange: false,
        });
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Exit----------------<|'
    );
    return true;
  }
  /* ---------------------------- Validate Line End --------------------------- */
  //
  /* --------------------------- Field Changed Begin -------------------------- */
  function fieldChanged(context) {
    var loggerTitle = ' Field Changed ';
    log.audit(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Entry----------------<|'
    );
    //
    try {
      var currentRecord = context.currentRecord;
      var sublistName = context.sublistId;
      var sublistFieldName = context.fieldId;

      if (sublistName === 'item' && sublistFieldName === 'quantity') {
        var nominalWidth = currentRecord.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_nominal_width',
        });
        var nominalThickness = currentRecord.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_nominal_thickness',
        });
        var linearFeet = currentRecord.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'quantity',
        });
        var boardFeet = linearFeet * (nominalWidth / 12) * nominalThickness;

        boardFeet = boardFeet.toFixed(3);

        currentRecord.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_dm_po_board_feet',
          value: boardFeet,
          ignoreFieldChange: false,
        });
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Exit----------------<|'
    );
  }
  /* --------------------------- Field Changed End -------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.validateLine = validateLine;
  exports.fieldChanged = fieldChanged;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
