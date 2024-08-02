/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name: diverse_Module_setAllocationAmountsOnExpensesLine.js
 * Author           Date       Version               Remarks
 * nagendrababu  01st Aug 2024  1.00           Initial creation of the script.
 *
 */

/* global define,log */

define(['N/search'], (search) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------ Set Allocation Expenses Line - Begin ------------------ */
  /**
   *
   * @param {object} scriptContext
   */
  const setAllocationExpensesLine = (scriptContext) => {
    const loggerTitle = ' Set Allocation Expenses Line ';
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Entry--------<|');
    //
    try {
      log.debug(loggerTitle, 'Type: ' + scriptContext.type);
      //
      if (scriptContext.type === scriptContext.UserEventType.CREATE) {
        const vendorBillRecord = scriptContext.newRecord;
        createRecord(vendorBillRecord);
      }
      //
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Exit--------<|');
  };
  /* ------------------ Set Allocation Expenses Line - End ------------------ */
  //
  /* ------------------------- Helper Functions - Begin ------------------------ */
  //
  /* *********************** Get DCT Allocation List - Begin *********************** */
  /**
   *
   * @returns {Array} dctResults
   */
  const getDCTAllocationList = () => {
    const loggerTitle = ' Get DCT Allocation List ';
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Entry--------<|');
    //
    let dctResults;
    try {
      // Columns
      const arrColumns = [];
      arrColumns.push(
        search.createColumn({
          name: 'custrecord_dct_allocation_percent',
        })
      );
      arrColumns.push(
        search.createColumn({
          name: 'custrecord_dct_allocation_division',
        })
      );
      //
      dctResults = getAllSearchResults(
        'customrecord_dct_allocation',
        null,
        null,
        arrColumns
      );
      log.debug(loggerTitle + ' DCT RESULTS ', dctResults);
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Exit--------<|');
    return dctResults;
  };
  /* *********************** Get DCT Allocation List - End *********************** */
  //
  /* *********************** Get All Search Results - Begin *********************** */
  /**
   *
   * @param {String} stRecordType
   * @param {String} stSavedSearch
   * @param {Array} arrFilters
   * @param {Array} arrColumns
   * @returns
   */
  const getAllSearchResults = (
    stRecordType,
    stSavedSearch,
    arrFilters,
    arrColumns
  ) => {
    const loggerTitle = ' Get All Search Results ';
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Entry--------<|');
    //
    let arrResult = [];
    let searchResults;
    try {
      if (stSavedSearch) {
        searchResults = search.load({
          id: stSavedSearch,
          type: stRecordType,
        });
        for (let i = 0; arrColumns != null && i < arrColumns.length; i++) {
          searchResults.columns.push(arrColumns[i]);
        }
        for (let i = 0; arrFilters != null && i < arrFilters.length; i++) {
          searchResults.filters.push(arrFilters[i]);
        }
      } else {
        searchResults = search.create({
          type: stRecordType,
          columns: arrColumns,
          filters: arrFilters,
        });
      }

      let count = 1000;
      let init = true;
      let min = 0;
      let max = 1000;

      while (count === 1000 || init) {
        let resultSet = searchResults.run().getRange({
          start: min,
          end: max,
        });

        arrResult = arrResult.concat(resultSet);
        min = max;
        max += 1000;

        init = false;
        count = resultSet.length;
      }
      log.debug(loggerTitle, ' Results Set Length: ' + arrResult.length);
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Exit--------<|');

    return arrResult;
  };
  /* *********************** Get All Search Results - End *********************** */
  //
  /* *********************** Convert Percentage To Decimal - Begin *********************** */
  /**
   *
   * @param {String} percentageString
   * @returns {Number}
   */
  const convertPercentageToDecimal = (percentageString) => {
    let number = 0;
    if (percentageString) {
      // Remove the '%' symbol and convert to a number
      number = parseFloat(percentageString.replace('%', ''));
    }

    // Divide by 100 to convert to decimal
    return number ? number / 100 : 0;
  };
  /* *********************** Convert Percentage To Decimal - End *********************** */
  //
  /* *********************** Create Record - Begin *********************** */
  const createRecord = (vendorBillRecord) => {
    const loggerTitle = ' Create Record ';
    try {
      // Allocate Check box
      const allocateBox = vendorBillRecord.getValue({
        fieldId: 'custbody_dct_allocate',
      });
      //
      // Allocation Amount
      const allocationAmount = vendorBillRecord.getValue({
        fieldId: 'custbody_dct_allocation_amount',
      });
      //
      // Allocation Account
      const allocationAccount = vendorBillRecord.getValue({
        fieldId: 'custbody_dct_allocation_acct',
      });
      //
      // Location
      const location = vendorBillRecord.getValue({
        fieldId: 'location',
      });
      //
      const populateDCTLines =
        allocationAccount && allocationAmount && allocateBox;

      if (populateDCTLines) {
        const vbLineCount = vendorBillRecord.getLineCount({
          sublistId: 'expense',
        });
        log.debug(loggerTitle, ' Vendor Bill Line Count: ' + vbLineCount);
        //
        const results = getDCTAllocationList();
        log.debug(loggerTitle, ' Add Allocation DCT Line: ');
        //
        // Loop Thru Expenses Line
        for (let index = 0; index < vbLineCount; index++) {
          if (index == vbLineCount - 1) {
            log.debug(loggerTitle, ' Adding DCT Lines ');
            let lastIndex = vbLineCount;
            // Insert all the DCT Allocation Lists
            for (let index1 = 0; index1 < results.length; index1++) {
              log.debug(loggerTitle, ' Inserting Line at: ' + lastIndex);
              // Insert DCT Lines
              vendorBillRecord.insertLine({
                sublistId: 'expense',
                line: lastIndex,
              });
              vendorBillRecord.setSublistValue({
                sublistId: 'expense',
                fieldId: 'account',
                value: allocationAccount,
                line: lastIndex,
              });
              vendorBillRecord.setSublistValue({
                sublistId: 'expense',
                fieldId: 'location',
                value: location,
                line: lastIndex,
              });
              vendorBillRecord.setSublistValue({
                sublistId: 'expense',
                fieldId: 'department',
                value: results[index1].getValue(
                  'custrecord_dct_allocation_division'
                ),
                line: lastIndex,
              });
              let amount =
                convertPercentageToDecimal(
                  results[index1].getValue('custrecord_dct_allocation_percent')
                ) * allocationAmount;
              vendorBillRecord.setSublistValue({
                sublistId: 'expense',
                fieldId: 'amount',
                value: amount,
                line: lastIndex,
              });
              vendorBillRecord.setSublistValue({
                sublistId: 'expense',
                fieldId: 'amount',
                value: amount,
                line: lastIndex,
              });
              lastIndex += 1;
            }
            //
          }
        }

        //
      }
      //
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
  };
  /* *********************** Create Record - End *********************** */
  //
  /* ------------------------- Helper Functions - End ------------------------ */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = setAllocationExpensesLine;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
