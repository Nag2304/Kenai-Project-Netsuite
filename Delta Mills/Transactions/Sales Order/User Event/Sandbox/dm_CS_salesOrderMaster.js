/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */

/*global define,log */

define(['N/currentRecord', 'N/format', 'N/url'], function (
  currentRecord,
  format,
  url
) {
  const exports = {};
  /* ------------------------ Page Init Begin ------------------------ */
  function pageInit(scriptContext) {
    try {
      var rec = scriptContext.currentRecord;
      var customForm = rec.getValue({
        fieldId: 'customform',
      });
      log.debug('debug', customForm);
      if (customForm === '172' || customForm === 172) {
        rec.setValue({ fieldId: 'requireddepositpercentage', value: '60.00' });
      }
    } catch (error) {
      log.error('page init failed to load', error);
    }
  }

  /* ------------------------ Page Init End ------------------------ */
  //
  /* ---------------------------- Validate Line Begin --------------------------- */
  function validateLine(context) {
    var strLoggerTitle = 'Validate Line Customer Order';
    log.debug(
      strLoggerTitle,
      '|>-------------------------------Entry-------------------------------<|'
    );
    try {
      var netsuiteQuantity = 0;
      var currentRecord = context.currentRecord;
      var sublistId = context.sublistId;

      var itemId;
      if (sublistId == 'item') {
        itemId = currentRecord.getCurrentSublistValue({
          sublistId: sublistId,
          fieldId: 'item',
        });
      }
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

      //
      /* ------------------------- 08042022 Changes Begin ------------------------- */
      var nominalThickness = currentRecord.getCurrentSublistValue({
        sublistId: 'item',
        fieldId: 'custcol_nominal_thickness',
      });
      var nominalWidth = currentRecord.getCurrentSublistValue({
        sublistId: 'item',
        fieldId: 'custcol_nominal_width',
      });
      var rawNominalThickness = currentRecord.getCurrentSublistValue({
        sublistId: 'item',
        fieldId: 'custcol_dm_raw_nom_thick',
      });
      var rawNominalWidth = currentRecord.getCurrentSublistValue({
        sublistId: 'item',
        fieldId: 'custcol_dm_raw_nom_width',
      });
      /* ------------------------- 08042022 Changes End ------------------------- */
      //

      // Linear Feet: (Sell Quantity) * (Nominal Thickness/RAW Nominal Thickness) * ( Nominal Width / RAW Nominal Width)
      //* Added New Logic to Check if Sell UOM is in Linear Feet then set the quantity
      //* field as Sell Qty
      if (
        sellQty > 0 &&
        (sellUOM === '1' || sellUOM === 1) &&
        nominalThickness > 0 &&
        nominalWidth > 0 &&
        rawNominalThickness > 0 &&
        rawNominalWidth
      ) {
        netsuiteQuantity =
          sellQty *
          (nominalThickness / rawNominalThickness) *
          (nominalWidth / rawNominalWidth);
        log.debug('Units', 'Units Linear Feet');

        currentRecord.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'quantity',
          value: netsuiteQuantity.toFixed(1),
          ignoreFieldChange: false,
        });
      }
      //* If the Sell UOM is in Square Feet then set the quantity field as Calculated below.
      // Square Feet: (Sell Quantity) * (Nominal Thickness/RAW Nominal Thickness) * ( Nominal Width / RAW Nominal Width) * (12/Finished Dimensions Exposed Face))
      else if (
        sellQty > 0 &&
        faceWidth > 0 &&
        (sellUOM === '2' || sellUOM === 2) &&
        nominalThickness > 0 &&
        nominalWidth > 0 &&
        rawNominalThickness > 0 &&
        rawNominalWidth
      ) {
        log.debug('Units', 'Units Square Feet');

        netsuiteQuantity =
          (12 / faceWidth) *
          sellQty *
          (nominalThickness / rawNominalThickness) *
          (nominalWidth / rawNominalWidth);

        netsuiteQuantity = netsuiteQuantity.toFixed(1);
        currentRecord.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'quantity',
          value: netsuiteQuantity,
          ignoreFieldChange: false,
        });
      } else {
        log.debug('Units', 'Units Each');

        currentRecord.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'quantity',
          value: sellQty,
          ignoreFieldChange: false,
        });
        netsuiteQuantity = sellQty;
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

      //!console.log(sellAmount, priceDisplay, netsuiteQuantity);

      log.debug('Price level Custom', [
        sellAmount,
        priceDisplay,
        netsuiteQuantity,
      ]);

      if (sellAmount > 0 && priceDisplay == 'Custom' && netsuiteQuantity > 0) {
        var netsuiteRate = sellAmount / netsuiteQuantity;
        netsuiteRate = parseFloat(netsuiteRate).toFixed(2);
        log.debug('Netsuite Rate', netsuiteRate);
        //
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

      log.debug('Item Type', itemType);
      if (itemType !== 'Assembly' || itemType !== 'InvtPart') {
        currentRecord.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'amount',
          value: sellAmount,
          ignoreFieldChange: false,
        });
      }

      //? Set Default Value to Austin
      currentRecord.setCurrentSublistValue({
        sublistId: 'item',
        fieldId: 'location',
        value: 2,
        ignoreFieldChange: false,
      });

      var quantity = currentRecord.getCurrentSublistValue({
        sublistId: 'item',
        fieldId: 'quantity',
      });
      if (quantity !== 0) {
        //Units
        var units = currentRecord.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_dm_sell_uom',
        });
        //Face Width
        faceWidth = currentRecord.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_dm_fd_exp_face_width',
        });

        if (faceWidth > 0) {
          //Total Linear Feet
          if (units == 1) {
            var totalLinearFeet = (12 / faceWidth) * quantity;
            if (totalLinearFeet > 0) {
              totalLinearFeet = totalLinearFeet.toFixed(2);
              currentRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_dm_linear_feet',
                value: quantity.toFixed(2),
                ignoreFieldChange: false,
              });
              currentRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_dm_total_square_feet',
                value: totalLinearFeet.toFixed(2),
                ignoreFieldChange: false,
              });
            }
          } else if (units == 2) {
            //Total Square Feet
            var totalSquareFeet = (faceWidth / 12) * quantity;
            if (totalSquareFeet > 0) {
              totalSquareFeet = totalSquareFeet.toFixed(2);
              currentRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_dm_total_square_feet',
                value: quantity.toFixed(2),
                ignoreFieldChange: false,
              });
              currentRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_dm_linear_feet',
                value: totalSquareFeet.toFixed(2),
                ignoreFieldChange: false,
              });
            }
          }
        }
      }
    } catch (error) {
      log.error('validate line failed to execute', error);
    }
    log.debug(
      strLoggerTitle,
      '|>-------------------------------Exit-------------------------------<|'
    );
    return true;
  }
  /* ---------------------------- Validate Line End --------------------------- */
  //
  /* --------------------------- Field Changed Begin -------------------------- */
  function fieldChanged(context) {
    try {
      var currentRecord = context.currentRecord;
      var sublistName = context.sublistId;
      var sublistFieldName = context.fieldId;
      //!console.log("triggered");
      if (
        sublistName === 'item' &&
        sublistFieldName === 'custcol_dm_sell_rate'
      ) {
        //!console.log("triggered");
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
      // Populate Dates when the job status is changed.
      populateDates(context, currentRecord);
      //
    } catch (error) {
      log.error('field changed failed to execute', error);
    }
  }
  function populateDates(context, currentRecord) {
    var fieldChanged = context.fieldId;
    if (fieldChanged === 'custbody_job_status') {
      var jobStatus = currentRecord.getValue({
        fieldId: 'custbody_job_status',
      });

      // Get date and set in mm/dd/yyy
      var currentDate = dateNow();
      currentDate = format.parse({
        value: currentDate,
        type: format.Type.DATE,
      });
      //console.log(currentDate);
      //

      //13 -07 Ship Staged
      if (jobStatus === '13') {
        currentRecord.setValue({
          fieldId: 'custbody_dm_prod_end_date',
          value: currentDate,
        });
      }
      //14 - 08 Completed
      else if (jobStatus === '14') {
        currentRecord.setValue({
          fieldId: 'custbody_dm_completion_date',
          value: currentDate,
        });
      }
      //
    }
  }

  function dateNow() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1;
    var yyyy = today.getFullYear();
    today = mm + '/' + dd + '/' + yyyy; // change the format depending on the date format preferences set on your account
    return today;
  }

  /* ---------------------------- Field Changed End --------------------------- */
  //
  /* --------------------------- Save Record Begin -------------------------- */
  function saveRecord(context) {
    try {
      var currentRecord = context.currentRecord;
      var total = 0;

      var requiredDepositAmt = Number(
        currentRecord.getValue({
          fieldId: 'requireddepositamount',
        })
      );
      if (requiredDepositAmt > 0) {
        currentRecord.setValue({
          fieldId: 'custbody_solupay_req_deposit_amount',
          value: requiredDepositAmt,
        });
      }

      var numOfLines = currentRecord.getLineCount({
        sublistId: 'item',
      });
      currentRecord.setValue({
        fieldId: 'custbody_dm_total_so_lines',
        value: numOfLines,
        ignoreFieldChange: true,
        forceSyncSourcing: true,
      });

      /* --------------------------- Item Sublist Begin --------------------------- */
      for (var i = 0; i < numOfLines; i++) {
        /* ----------------------------- March 4th Begin ---------------------------- */
        var totalSquareFeet = currentRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_dm_total_square_feet',
          line: i,
        });
        if (totalSquareFeet > 0) {
          total += totalSquareFeet;
        }
        console.log(totalSquareFeet, total);
        /* ----------------------------- March 4th End ---------------------------- */

        var nominalWidth = currentRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_nominal_width',
          line: i,
        });
        var quantity = currentRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'quantity',
          line: i,
        });

        if (nominalWidth > 0 && quantity > 0) {
          var squareFeetOfRaw = (nominalWidth / 12) * quantity;

          currentRecord.selectLine({
            sublistId: 'item',
            line: i,
          });
          currentRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_dm_square_feet_raw_lumber',
            line: i,
            value: squareFeetOfRaw,
          });
          currentRecord.commitLine({
            sublistId: 'item',
          });
        }
      }
      /* --------------------------- Item Sublist End --------------------------- */
      //
      //total = parseInt(total);
      currentRecord.setValue({
        fieldId: 'custbody_dm_total_square_feet_co',
        value: total,
        ignoreFieldChange: true,
        forceSyncSourcing: true,
      });
      /* --------------------------- Sales Order End --------------------------- */
    } catch (error) {
      log.error('save record failed to execute', error);
    }
    return true;
  }
  /* --------------------------- Save Record End -------------------------- */
  //
  /* ------------------------- Call for suitelet Begin ------------------------ */
  function CallforSuiteletSO() {
    try {
      /* -------------------------- Record Details Begin -------------------------- */
      var record = currentRecord.get();
      var recId = record.id;
      /* --------------------------- Record Details End --------------------------- */
      var suiteletURL = url.resolveScript({
        scriptId: 'customscript_su_dm_salesorderprint',
        deploymentId: 'customdeploy_su_dm_salesorderprint',
        params: { recId: recId },
      });
      window.location = suiteletURL;
    } catch (error) {
      log.error('CallforSuiteletSO failed to execute', error);
    }
  }
  /* -------------------------- Call for suitelet End ------------------------- */
  //
  /* ------------------------- Call for suitelet Begin ------------------------ */
  function CallforSuitelet() {
    try {
      /* -------------------------- Record Details Begin -------------------------- */
      var record = currentRecord.get();
      var recId = record.id;
      var recType = record.type;
      /* --------------------------- Record Details End --------------------------- */

      var suiteletURL = url.resolveScript({
        scriptId: 'customscript_dm_fakeinvoice',
        deploymentId: 'customdeploy_dm_fakeinvoiceprint_suite',
        params: { recId: recId, recType: recType },
      });
      window.location = suiteletURL;
    } catch (error) {
      log.error('CallforSuitelet failed to execute', error);
    }
  }
  /* -------------------------- Call for suitelet End ------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.pageInit = pageInit;
  //exports.validateLine = validateLine;
  exports.fieldChanged = fieldChanged;
  exports.saveRecord = saveRecord;
  exports.CallforSuiteletSO = CallforSuiteletSO;
  exports.CallforSuitelet = CallforSuitelet;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
