/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record'], (search, record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  const filtersArr = [];
  const columnsArr = [
    search.createColumn({
      name: 'custrecord_rrb_account',
      label: 'Account',
    }),
    search.createColumn({
      name: 'custrecord_rrb_currency',
      label: 'Currency',
    }),
  ];
  /* ------------------------ Global Variables - End ------------------------ */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    return search.create({
      type: 'salesorder',
      filters: [
        ['type', 'anyof', 'SalesOrd'],
        'AND',
        ['status', 'anyof', 'SalesOrd:F', 'SalesOrd:E'],
        'AND',
        ['mainline', 'is', 'T'],
        'AND',
        ['email', 'isnotempty', ''],
      ],
      columns: [
        search.createColumn({ name: 'internalid', label: 'Internal ID' }),
      ],
    });
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ----------------------------- Reduce - Begin ----------------------------- */
  const reduce = (scriptContext) => {
    const strLoggerTitle = 'Reduce Phase';
    try {
      // Retrieve Search Results
      let customRecordResultsArr = getAllSearchResults(
        'customrecord_rrb_currencytoarccount',
        filtersArr,
        columnsArr
      );
      log.debug(
        strLoggerTitle + ' Custom Search Results',
        customRecordResultsArr
      );
      //
      //Get ID
      const soId = parseInt(scriptContext.key);
      log.debug(strLoggerTitle + ' SO Internal ID', soId);
      //
      /* ------------------------- Transform Record Begin ------------------------- */

      if (customRecordResultsArr.length) {
        const invRecord = record.transform({
          fromType: 'salesorder',
          fromId: soId,
          toType: 'invoice',
        });

        //Currency
        const invCurrency = invRecord.getValue({ fieldId: 'currency' });

        if (
          invCurrency !== undefined ||
          invCurrency !== null ||
          invCurrency !== ''
        ) {
          log.debug(
            strLoggerTitle + ' Currency Value',
            `Currency Value on the invoice record is ${invCurrency}`
          );
          // Retrieve the Account ID from the Custom Record.
          let invAccountId;
          for (let i = 0; i < customRecordResultsArr.length; i++) {
            if (customRecordResultsArr[i].currency == invCurrency) {
              invAccountId = customRecordResultsArr[i].account;
              log.debug(
                strLoggerTitle,
                `Currency Value for the Account ${invAccountId} is ${invCurrency}`
              );
              break;
            }
          }
          if (
            invAccountId !== undefined ||
            invAccountId !== null ||
            invAccountId !== ''
          ) {
            invRecord.setValue({ fieldId: 'account', value: invAccountId });
          } else {
            log.debug(
              strLoggerTitle,
              `Account ID not found on the custom record:${invAccountId}`
            );
          }
        } else {
          log.debug(
            strLoggerTitle,
            'Currency Value from the invoice record is empty'
          );
        }

        //Save the Record
        const invoiceId = invRecord.save();
        log.debug(strLoggerTitle + ' Newly Created Invoice ID', invoiceId);
      }

      /* -------------------------- Transform Record End -------------------------- */
      //
    } catch (err) {
      log.audit(strLoggerTitle + ' Failed To Execute ', err);
    }
  };
  /* ----------------------------- Reduce - End ----------------------------- */
  //
  /* ----------------------- Get All Search Results - Begin ----------------------- */
  /**
   *
   * @param {string} searchType
   * @param {array} filtersArr
   * @param {array} columnsArr
   * @returns Array of search results in object wise.
   */
  function getAllSearchResults(searchType, filtersArr, columnsArr) {
    let customRecordObj = {};
    const customRecordResultsArr = [];
    /* ----------------------- custom Record Search - Begin ----------------------- */
    const currencytoarccountSearchObj = search.create({
      type: searchType,
      filters: filtersArr,
      columns: columnsArr,
    });
    /* ----------------------- custom Record Search - End ----------------------- */
    currencytoarccountSearchObj.run().each(function (result) {
      // .run().each has a limit of 4,000 results
      // Account
      const accountResult = result.getValue({
        name: 'custrecord_rrb_account',
        label: 'Account',
      });
      //Currency
      const currency = result.getValue({
        name: 'custrecord_rrb_currency',
        label: 'Currency',
      });
      customRecordObj.account = accountResult;
      customRecordObj.currency = currency;
      customRecordResultsArr.push(customRecordObj);
      customRecordObj = {};
      return true;
    });
    return customRecordResultsArr;
  }
  /* ------------------------ Get All Search Results - End ------------------------ */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.getInputData = getInputData;
  exports.reduce = reduce;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
