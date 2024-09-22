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
    // Walgreens Co. (5185)
    // Amazon US FBM - 6570 (Zola.com)
    //10389816 - 5440
    return search.create({
      type: 'salesorder',
      filters: [
        ['type', 'anyof', 'SalesOrd'],
        'AND',
        ['status', 'anyof', 'SalesOrd:B'],
        'AND',
        ['mainline', 'is', 'T'],
        'AND',
        ['custbody_ready_to_fulfill_2', 'is', 'F'],
        'AND',
        ['name', 'anyof', '5185', '6570', '5440'],
      ],
      columns: [
        search.createColumn({ name: 'internalid', label: 'Internal ID' }),
      ],
    });
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ---------------------------- Reduce Phase - Begin --------------------------- */
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
      log.debug(strLoggerTitle + ' Reduce Context Keys', key);
      //
      const salesOrderRecord = record.load({ type: 'salesorder', id: key });
      log.debug(strLoggerTitle, 'Sales Order Record Loaded Successfully');

      // Loop through the line items
      const salesOrderLineCount = salesOrderRecord.getLineCount({
        sublistId: 'item',
      });

      let quantityMatchFlag = true;
      let readyToFulfillFlag = true;

      for (let index = 0; index < salesOrderLineCount; index++) {
        const itemType = salesOrderRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'itemtype',
          line: index,
        });
        const isClosed = salesOrderRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'isclosed',
          line: index,
        });
        //
        if (itemType === 'InvtPart' && isClosed === false) {
          const quantity = parseInt(
            salesOrderRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'quantity',
              line: index,
            })
          );

          const quantityCommitted = parseInt(
            salesOrderRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'quantitycommitted',
              line: index,
            })
          );

          if (quantityCommitted !== quantity) {
            quantityMatchFlag = false;
          }
        }
      }

      log.debug(strLoggerTitle, 'Quantity Match Flag: ' + quantityMatchFlag);

      if (!quantityMatchFlag) {
        salesOrderRecord.setValue({ fieldId: 'orderstatus', value: 'A' });
        log.debug(
          strLoggerTitle,
          'Order has quantitycommitted != quantity. Aborting the order.'
        );
      } else {
        salesOrderRecord.setValue({ fieldId: 'orderstatus', value: 'B' });

        for (let index = 0; index < salesOrderLineCount; index++) {
          const itemType = salesOrderRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'itemtype',
            line: index,
          });

          const isClosed = salesOrderRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'isclosed',
            line: index,
          });

          if (itemType === 'InvtPart' && isClosed === false) {
            const lineQuantity = parseInt(
              salesOrderRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: index,
              })
            );

            if (lineQuantity > 9) {
              salesOrderRecord.setSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_ready_for_fulfillment',
                line: index,
                value: false,
              });
              readyToFulfillFlag = false;
            }
          }
        }
        log.debug(
          strLoggerTitle,
          ' Ready To Fulfill Flag:' + readyToFulfillFlag
        );
        //
        if (readyToFulfillFlag) {
          for (let index1 = 0; index1 < salesOrderLineCount; index1++) {
            const itemType = salesOrderRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'itemtype',
              line: index1,
            });

            const isClosed = salesOrderRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'isclosed',
              line: index1,
            });

            if (itemType === 'InvtPart' && isClosed === false) {
              const lineQuantity = parseInt(
                salesOrderRecord.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'quantity',
                  line: index1,
                })
              );
              log.debug(strLoggerTitle, ' Line Quantity ' + lineQuantity);

              salesOrderRecord.setSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_ready_for_fulfillment',
                line: index1,
                value: true,
              });
              log.debug(
                strLoggerTitle,
                ' Ready to Fulfill Flag is set to True'
              );
            }
          }
        } else {
          for (let index1 = 0; index1 < salesOrderLineCount; index1++) {
            const itemType = salesOrderRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'itemtype',
              line: index1,
            });

            const isClosed = salesOrderRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'isclosed',
              line: index1,
            });

            if (itemType === 'InvtPart' && isClosed === false) {
              const lineQuantity = parseInt(
                salesOrderRecord.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'quantity',
                  line: index1,
                })
              );
              log.debug(strLoggerTitle, ' Line Quantity ' + lineQuantity);

              salesOrderRecord.setSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_ready_for_fulfillment',
                line: index1,
                value: false,
              });
              log.debug(
                strLoggerTitle,
                ' Ready to Fulfill Flag is set to false'
              );
            }
          }
        }
        //
      }

      salesOrderRecord.save();
      log.audit(strLoggerTitle, 'Sales Order Record Updated Successfully');
      //
    } catch (error) {
      log.error(strLoggerTitle + ' caught an exception', error);
    }
  };

  /* ---------------------------- Reduce Phase - Begin --------------------------- */
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
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
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
