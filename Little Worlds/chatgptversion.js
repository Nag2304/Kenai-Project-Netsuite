/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

/*global define,log*/

define(['N/search', 'N/record', 'N/file'], (search, record, file) => {
  //
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  const invoiceDates = [
    {
      ID: '3030847',
      Date: '5/31/2023',
    },
    {
      ID: '3190013',
      Date: '5/31/2023',
    },
    {
      ID: '3190210',
      Date: '5/31/2023',
    },
    {
      ID: '3190323',
      Date: '5/31/2023',
    },
    {
      ID: '3311266',
      Date: '5/30/2023',
    },
  ];
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    return invoiceDates;
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ----------------------------- Reduce - Begin ----------------------------- */
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
      const results = reduceContext.values;

      log.debug(strLoggerTitle + 'Before parsing', results);
      const invoiceValues = JSON.parse(results[0]);
      log.debug(strLoggerTitle + ' After Parsing Results', invoiceValues);

      // Get the Sales Order
      const invoiceSearchFields = search.lookupFields({
        type: search.Type.INVOICE,
        id: String(invoiceValues.ID),
        columns: ['createdfrom'],
      });
      log.debug(strLoggerTitle, invoiceSearchFields);

      // Get the Sales Order Internal ID
      const soInternalId = invoiceSearchFields.createdfrom[0].value;

      // Get Item Fulfillments Related to SO Internal ID
      const itemFulfillmentSearch = search.create({
        type: 'itemfulfillment',
        filters: [
          ['type', 'anyof', 'ItemShip'],
          'AND',
          ['mainline', 'is', 'T'],
          'AND',
          ['createdfrom.internalidnumber', 'equalto', soInternalId],
        ],
        columns: ['internalid'],
      });

      itemFulfillmentSearch.run().each(function (result) {
        const itemFulfillmentInternalId = result.getValue({
          name: 'internalid',
        });

        reduceContext.write({
          key: invoiceValues.ID,
          value: itemFulfillmentInternalId,
        });
        return true;
      });
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
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
      let fileContent = 'Invoice ID,Item Fulfillment Internal ID\n';

      summarizeContext.output.iterator().each(function (key, value) {
        fileContent += `${key},${value}\n`;
        return true;
      });

      const csvFile = file.create({
        name: 'ItemFulfillment_InternalIDs.csv',
        fileType: file.Type.CSV,
        contents: fileContent,
      });

      csvFile.folder = -15;

      log.debug(strLoggerTitle, fileContent);

      const fileId = csvFile.save();
      log.debug('CSV File ID', fileId);
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
