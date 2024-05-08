/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

/*global define,log*/

define(['N/record', 'N/search'], (record, search) => {
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
        ['datecreated', 'on', 'yesterday'],
      ],
      columns: [
        search.createColumn({
          name: 'pricelevel',
          join: 'customer',
          label: 'Price Level',
        }),
        search.createColumn({
          name: 'category',
          join: 'customer',
          label: 'Category',
        }),
      ],
    });
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ------------------------------ Reduce - Begin ------------------------------ */
  /**
   *
   * @param {object} reduceContext
   */
  const reduce = (reduceContext) => {
    const strLoggerTitle = 'Reduce Phase';
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + ' -Entry ------------------<|'
    );
    //
    try {
      // Retrieve Key & values.
      const key = reduceContext.key;
      const results = JSON.parse(reduceContext.values[0]);
      log.debug(strLoggerTitle + ' After Parsing Results', results);
      //
      const customerPriceLevel = results.values['pricelevel.customer'].text;
      log.debug(strLoggerTitle, ' Customer Price Level: ' + customerPriceLevel);
      const category = results.values['category.customer'].value;
      log.debug(strLoggerTitle, ' Category: ' + category);
      //
      // Load Sales record
      const salesOrderRecord = record.load({
        type: record.Type.SALES_ORDER,
        id: key,
      });
      log.audit(strLoggerTitle, ' Sales Order Loaded Successfully');
      //
      const lineItemCount = salesOrderRecord.getLineCount({
        sublistId: 'item',
      });
      log.debug(strLoggerTitle, ' Sales Order Line Count: ' + lineItemCount);

      const soHeaderCancelReason = salesOrderRecord.getValue({
        fieldId: 'custbody_wdym_cancel_reason',
      });
      //
      /* ------------------------- Item Line Count - Begin ------------------------ */
      for (let index = 0; index < lineItemCount; index++) {
        // Cancel Reason
        if (soHeaderCancelReason) {
          salesOrderRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_wdym_cancel_reason',
            value: soHeaderCancelReason,
            line: index,
          });
        }

        //Item ID
        const itemId = salesOrderRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          line: index,
        });
        //
        // Item Type
        const itemType = salesOrderRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'itemtype',
          line: index,
        });
        // Customer Price
        const customerPrice = salesOrderRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_wdym_customer_price',
          line: index,
        });
        //
        log.debug(strLoggerTitle, {
          salesOrderItemId: itemId,
          salesOrderItemType: itemType,
          salesOrdercustomerPrice: customerPrice,
        });
        if (!customerPrice) {
          // Record Type Item
          let recItem;
          if (itemType == 'InvtPart') {
            recItem = record.load({
              type: record.Type.INVENTORY_ITEM,
              id: itemId,
            });
          } else if (itemType == 'NonInvtPart') {
            recItem = record.load({
              type: record.Type.NON_INVENTORY_ITEM,
              id: itemId,
            });
          } else if (itemType == 'Service') {
            recItem = record.load({
              type: record.Type.SERVICE_ITEM,
              id: itemId,
            });
          } else if (itemType == 'Assembly') {
            recItem = record.load({
              type: record.Type.ASSEMBLY_ITEM,
              id: itemId,
            });
          }
          //
          /* ------------------------- Items Checking - Begin ------------------------- */
          if (recItem) {
            log.debug(strLoggerTitle, ' Item Record Loaded Successfully');
            /* ----------------------- Retrieve Price Logic Begin ----------------------- */
            let lineCount = recItem.getLineCount({ sublistId: 'price1' });
            log.debug(strLoggerTitle, 'Item Line Count: ' + lineCount);
            //
            /* ---------------------------- Line Count Begin ---------------------------- */
            let itemPrice;
            //if the customer category is international and there is no customer specific price then FOB price.
            for (let index2 = 0; index2 < lineCount; index2++) {
              const itemCustName = recItem
                .getSublistValue({
                  sublistId: 'price1',
                  fieldId: 'pricelevelname',
                  line: index2,
                })
                .toUpperCase();

              if (itemCustName == customerPriceLevel.toUpperCase()) {
                log.audit('item customer name', [
                  itemCustName,
                  customerPriceLevel,
                ]);
                itemPrice = recItem.getSublistValue({
                  sublistId: 'price1',
                  fieldId: 'price_1_',
                  line: index2,
                });

                break;
              }
            }
            //
            log.debug(
              'item price',
              'Item price from Item record for the line ' +
                index +
                ' is ' +
                itemPrice
            );
            //Fetch FOB price
            if (!itemPrice) {
              for (let index1 = 0; index1 < lineCount; index1++) {
                const itemCustNameFob = recItem.getSublistValue({
                  sublistId: 'price1',
                  fieldId: 'pricelevelname',
                  line: index1,
                });
                if (itemCustNameFob === 'FOB price' && category === '6') {
                  itemPrice = recItem.getSublistValue({
                    sublistId: 'price1',
                    fieldId: 'price_1_',
                    line: index1,
                  });

                  break;
                }
              }
              log.debug('item price', 'Item price from FOB Price ' + itemPrice);
            }

            if (itemPrice) {
              log.debug('item price', 'item price setting value ' + itemPrice);
              salesOrderRecord.setSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_wdym_customer_price',
                value: itemPrice,
                ignoreFieldChange: false,
                line: index,
              });
            }
          }
          /* -------------------------- Items Checking - End -------------------------- */
          //
        }
      }
      /* ------------------------- Item Line Count - End ------------------------ */
      //
      const salesOrderInternalId = salesOrderRecord.save();
      log.audit(
        strLoggerTitle,
        'Sales Order Internal ID Saved Successfully: ' + salesOrderInternalId
      );
    } catch (error) {
      log.error(strLoggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + ' -Exit ------------------<|'
    );
  };
  /* ------------------------------ Reduce - End ------------------------------ */
  //
  /* ------------------------- Summarize Phase - Begin ------------------------ */
  /**
   *
   * @param {object} summarizeContext
   */
  const summarize = (summarizeContext) => {
    const strLoggerTitle = 'Summarize Phase';
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + ' -Entry ------------------<|'
    );
    //
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
    //
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + ' -Exit ------------------<|'
    );
  };
  /* ------------------------- Summarize Phase - End ------------------------ */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.getInputData = getInputData;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
