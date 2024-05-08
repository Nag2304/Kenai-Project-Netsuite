/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */

/*global define,log*/

define(['N/currentRecord'], function (currentRecord) {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* -------------------------- FieldChanged - Begin -------------------------- */
  function fieldChanged(context) {
    var loggerTitle = 'Field Changed';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + '- Entry-------------------<|'
    );
    //
    try {
      var currentRecord = context.currentRecord;

      var sublistName = context.sublistId;
      var sublistFieldName = context.fieldId;
      if (
        sublistName === 'item' &&
        sublistFieldName === 'custcol_dm_sell_rate'
      ) {
        var sellRate = currentRecord.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_dm_sell_rate',
        });
        var sellQty = currentRecord.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_dm_sell_qty',
        });
        var sellAmt = sellRate * sellQty;
        currentRecord.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_dm_sell_amount',
          value: sellAmt,
          ignoreFieldChange: false,
        });
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + '- Exit-------------------<|'
    );
  }
  /* --------------------------- FieldChanged - End --------------------------- */
  //
  /* -------------------------- Validate Line - Begin ------------------------- */
  function validateLine(context) {
    var loggerTitle = 'Validate Line';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + '- Entry-------------------<|'
    );
    //
    try {
      var netsuiteQuantity = 0;
      var currentRecord = context.currentRecord;
      var sublistId = context.sublistId;

      if (sublistId == 'item') {
        var itemId = currentRecord.getCurrentSublistValue({
          sublistId: sublistId,
          fieldId: 'item',
        });

        if (itemId == '' || itemId == null || itemId == 'Nan') return true;

        var itemType = currentRecord.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'itemtype',
        });

        var priceDisplay = currentRecord.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'price_display',
        });

        if (priceDisplay !== 'Custom') {
          currentRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'price',
            value: -1,
            ignoreFieldChange: false,
          });

          currentRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'pricelevels',
            value: -1,
            ignoreFieldChange: false,
          });

          currentRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            value: 1,
            ignoreFieldChange: false,
          });
        }

        var sellQty = currentRecord.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_dm_sell_qty',
        });

        var faceWidth = currentRecord.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_dm_fd_exp_face_width',
        });

        var sellUOM = currentRecord.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_dm_sell_uom',
        });

        //* Added New Logic to Check if Sell UOM is in Linear Feet then set the quantity
        //* field as Sell Qty
        if (sellQty > 0 && (sellUOM === '1' || sellUOM === 1)) {
          netsuiteQuantity = sellQty;
          currentRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            value: sellQty,
            ignoreFieldChange: false,
          });
        }
        //* If the Sell UOM is in Square Feet then set the quantity field as Calculated below.
        else if (
          sellQty > 0 &&
          faceWidth > 0 &&
          (sellUOM === '2' || sellUOM === 2)
        ) {
          netsuiteQuantity = (12 / faceWidth) * sellQty;
          netsuiteQuantity = netsuiteQuantity.toFixed(1);
          currentRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            value: netsuiteQuantity,
            ignoreFieldChange: false,
          });
        }

        var sellRate = currentRecord.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_dm_sell_rate',
        });

        var sellAmount = sellQty * sellRate;

        currentRecord.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_dm_sell_amount',
          value: sellAmount,
          ignoreFieldChange: false,
        });

        if (
          sellAmount > 0 &&
          priceDisplay == 'Custom' &&
          netsuiteQuantity > 0
        ) {
          var netsuiteRate = sellAmount / netsuiteQuantity;
          netsuiteRate = parseFloat(netsuiteRate).toFixed(2);

          currentRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            value: netsuiteRate,
            ignoreFieldChange: false,
          });
          currentRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'amount',
            value: sellAmount,
            ignoreFieldChange: false,
          });
        }

        if (itemType !== 'Assembly' || itemType !== 'InvtPart') {
          currentRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'amount',
            value: sellAmount,
            ignoreFieldChange: false,
          });
        }

        currentRecord.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'location',
          value: 2,
          ignoreFieldChange: false,
        });
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + '- Exit-------------------<|'
    );
    return true;
  }
  /* --------------------------- Validate Line - End -------------------------- */
  //
  /* --------------------------- Save Record - Begin -------------------------- */
  function saveRecord() {
    var loggerTitle = 'Save Record';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + '- Entry-------------------<|'
    );
    var returnFlag = true;
    //
    try {
      var quoteRecord = currentRecord.get();

      var addAnOrder = quoteRecord.getValue({
        fieldId: 'custbody_add_on_order',
      });
      log.debug(loggerTitle, ' Add an Order: ' + addAnOrder);

      if (addAnOrder === '1') {
        var customerOrder = quoteRecord.getValue({
          fieldId: 'custbody_customer_order',
        });

        // If Customer Order is Empty then prevent save.
        if (!customerOrder) {
          alert(
            'ADD ON ORDER? field is Selected Yes. Customer Order is Empty.Please Enter Value for the Customer Order.'
          );
          returnFlag = false;
        } else {
          log.debug(loggerTitle, ' Customer Order is Populated Successfully');
        }
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + '- Entry-------------------<|'
    );
    return returnFlag;
  }
  /* ---------------------------- Save Record - End --------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.validateLine = validateLine;
  exports.fieldChanged = fieldChanged;
  exports.saveRecord = saveRecord;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
