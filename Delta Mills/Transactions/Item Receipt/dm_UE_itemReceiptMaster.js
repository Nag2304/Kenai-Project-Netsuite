/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

/*global define,log*/

define(['N/record', 'N/search'], (record, search) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* --------------------------- Before Load - Begin -------------------------- */
  const beforeLoad = (context) => {
    const strLoggerTitle = ' Before Load ';
    log.audit(
      strLoggerTitle,
      '|>---------------------' +
        strLoggerTitle +
        '- Entry---------------------<|'
    );
    //
    try {
    } catch (error) {
      log.error(strLoggerTitle + ' Caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>---------------------' +
        strLoggerTitle +
        '- Exit---------------------<|'
    );
  };
  /* ---------------------------- Before Load - End --------------------------- */
  //
  /* ------------------------ Before Submit Script Begin ------------------------ */
  const beforeSubmit = (scriptContext) => {
    const strLoggerTitle = 'Item Receipt Master';
    log.debug(strLoggerTitle, '|>-----------------Entry-----------------<|');
    try {
      //? Accumulated Variables
      let totalBoardLength = 0;
      let totalBoardCostRecd = 0;
      const itemReceiptRecord = scriptContext.newRecord;
      //
      /* ------------------------ Load Purchase Order Begin ----------------------- */
      const poRec = Number(
        itemReceiptRecord.getValue({ fieldId: 'createdfrom' })
      );
      const loadPORec = record.load({
        type: record.Type.PURCHASE_ORDER,
        id: poRec,
        isDynamic: true,
      });
      const poLineItemCount = loadPORec.getLineCount({ sublistId: 'item' });
      /* ------------------------ Load Purchase Order End ----------------------- */
      //
      const lineItemCount = itemReceiptRecord.getLineCount({
        sublistId: 'item',
      });

      if (lineItemCount) {
        for (let i = 0; i < lineItemCount; i++) {
          //
          /* ------------------------- Board Length IR - Begin ------------------------ */
          let boardLengthRateIR = 0;
          // Item ID
          const itemId = itemReceiptRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: i,
          });
          // Item Type
          const itemType = itemReceiptRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'itemtype',
            line: i,
          });
          // Get Nominal Width and Nominal Thickness
          const fieldLookup = search.lookupFields({
            type: search.Type.ITEM,
            id: String(itemId),
            columns: ['custitem1', 'custitem2'],
          });

          let nominalThickness = Number(fieldLookup['custitem1']);

          let nominalWidth = Number(fieldLookup['custitem2']);

          // Linear Feet
          let quantity = itemReceiptRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: i,
          });
          //
          /* ------------------------- Purchase Order Sublist Begin------------------------ */
          let poItemRate;
          for (var j = 0; j < poLineItemCount; j++) {
            let poItemId = loadPORec.getSublistValue({
              sublistId: 'item',
              fieldId: 'item',
              line: j,
            });
            if (poItemId === itemId) {
              poItemRate = loadPORec.getSublistValue({
                sublistId: 'item',
                fieldId: 'rate',
                line: j,
              });
              if (!nominalThickness) {
                nominalThickness = loadPORec.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_nominal_thickness',
                  line: j,
                });
              }
              if (!nominalWidth) {
                nominalWidth = loadPORec.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_nominal_width',
                  line: j,
                });
              }
              break;
            }
          }
          /* ------------------------- Purchase Order Sublist End------------------------ */
          if (poItemRate) {
            itemReceiptRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_dm_orig_po_rate',
              line: i,
              value: poItemRate,
            });
          }

          // Rate
          let itemRate = itemReceiptRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            line: i,
          });
          if (!itemRate) {
            itemRate = poItemRate;
          }

          let boardFeet = quantity * (nominalWidth / 12) * nominalThickness;

          if (boardFeet) {
            boardLengthRateIR = (quantity * itemRate) / boardFeet;

            boardLengthRateIR = boardLengthRateIR.toFixed(2);
          }

          log.debug({
            title: 'Values',
            details: [
              boardFeet,
              itemRate,
              quantity,
              nominalThickness,
              nominalWidth,
              itemId,
              itemType,
            ],
          });

          //   log.debug({ title: "Values", details: [boardLengthRateIR] });

          if (boardLengthRateIR > 0) {
            itemReceiptRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_dm_board_length_rate',
              line: i,
              value: boardLengthRateIR,
            });
          }
          if (boardFeet > 0) {
            itemReceiptRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_dm_po_board_feet',
              line: i,
              value: boardFeet,
            });
          }

          let totalLineLvlBoardCost = quantity * itemRate;
          if (totalLineLvlBoardCost) {
            itemReceiptRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_dm_total_line_brd_cost',
              line: i,
              value: totalLineLvlBoardCost,
            });
          }
          /* -------------------------- Board Length IR - End ------------------------- */
          //
          let sublistTotalBoardLength = itemReceiptRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_dm_po_board_feet',
            line: i,
          });
          if (sublistTotalBoardLength) {
            totalBoardLength += sublistTotalBoardLength;
          }

          let sublistTotalBoardCost = itemReceiptRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_dm_total_line_brd_cost',
            line: i,
          });
          if (sublistTotalBoardCost) {
            totalBoardCostRecd += sublistTotalBoardCost;
          }
        }
        log.debug('Total Values', [totalBoardCostRecd, totalBoardLength]);
      }
      //? Set the Values
      if (totalBoardLength) {
        totalBoardLength = totalBoardLength.toFixed(2);
        itemReceiptRecord.setValue({
          fieldId: 'custbody_dm_total_ir_bl',
          value: totalBoardLength,
        });
      }
      if (totalBoardCostRecd) {
        totalBoardCostRecd = totalBoardCostRecd.toFixed(2);
        itemReceiptRecord.setValue({
          fieldId: 'custbody_dm_total_ir_brd_cost',
          value: totalBoardCostRecd,
        });
      }
    } catch (error) {
      log.error(strLoggerTitle + ' caught an exception', error);
    }
    log.debug(strLoggerTitle, '|>-----------------Exit----------------<|');
  };
  /* ------------------------ Before Submit Script End ------------------------ */
  //
  //
  /* -------------------------- After Submit - Begin -------------------------- */
  const afterSubmit = (context) => {
    const strLoggerTitle = ' After Submit ';
    log.audit(
      strLoggerTitle,
      '|>---------------------' +
        strLoggerTitle +
        '- Entry---------------------<|'
    );
    //
    try {
    } catch (error) {
      log.error(strLoggerTitle + ' Caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>---------------------' +
        strLoggerTitle +
        '- Exit---------------------<|'
    );
  };
  /* --------------------------- After Submit - End --------------------------- */
  //
  /* ------------------------ Exports Begin ------------------------ */
  exports.beforeLoad = beforeLoad;
  exports.beforeSubmit = beforeSubmit;
  exports.afterSubmit = afterSubmit;
  return exports;
  /* ------------------------ Exports End ------------------------ */
});
