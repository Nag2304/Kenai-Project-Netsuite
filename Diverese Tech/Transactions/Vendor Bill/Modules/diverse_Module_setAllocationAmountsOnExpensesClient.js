/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name: diverse_Module_setAllocationAmountsOnExpensesClient.js
 * Author           Date       Version               Remarks
 *  nagendrababu  04th Aug 2024  1.00           Initial creation of the script.
 *
 */

/* global define,log */

define(['N/search'], function (search) {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ---------------------- Set Allocation Amounts - Begin ---------------------- */
  function setAllocationAmounts(vbRecord) {
    var loggerTitle = 'Set Allocation Amounts';
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Entry--------<|');
    //
    try {
      var allocateCheckboxBtn = vbRecord.getValue({
        fieldId: 'custbody_dct_allocate',
      });
      var allocationAmount = vbRecord.getValue({
        fieldId: 'custbody_dct_allocation_amount',
      });
      var allocationAccount = vbRecord.getValue({
        fieldId: 'custbody_dct_allocation_acct',
      });
      //
      log.debug('Button Clicked', 'Allocation Chkbox: ' + allocateCheckboxBtn);
      log.debug('Button Clicked', 'Allocation Amount: ' + allocationAmount);
      log.debug('Button Clicked', 'Allocation Account: ' + allocationAccount);
      //
      console.log(allocateCheckboxBtn);
      if (allocateCheckboxBtn && allocationAmount && allocationAccount) {
        // Your logic here
        insertAllocationLines(vbRecord, allocationAmount, allocationAccount);
      } else {
        alert(
          'Please enter the Allocate CheckBox (or) Allocation Amount (or) Allocation Account to add the lines'
        );
      }
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Exit--------<|');
  }
  /* ---------------------- Set Allocation Amounts - End ---------------------- */
  //
  /* ------------------------- Helper Functions - Begin ------------------------ */
  //
  /* *********************** Get DCT Allocation List - Begin *********************** */
  /**
   *
   * @returns {Array} dctResults
   */
  function getDCTAllocationList() {
    var loggerTitle = ' Get DCT Allocation List ';
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Entry--------<|');
    //
    var dctResults;
    try {
      // Columns
      var arrColumns = [];
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
  }
  /* *********************** Get DCT Allocation List - End *********************** */
  //
  /* *********************** Convert Percentage To Decimal - Begin *********************** */
  /**
   *
   * @param {String} percentageString
   * @returns {Number}
   */
  function convertPercentageToDecimal(percentageString) {
    var number = 0;
    if (percentageString) {
      // Remove the '%' symbol and convert to a number
      number = parseFloat(percentageString.replace('%', ''));
    }

    // Divide by 100 to convert to decimal
    return number ? number / 100 : 0;
  }
  /* *********************** Convert Percentage To Decimal - End *********************** */
  //
  /* *********************** Get All Search Results - Begin *********************** */
  function getAllSearchResults(
    stRecordType,
    stSavedSearch,
    arrFilters,
    arrColumns
  ) {
    var arrResult = [];
    var searchResults;
    if (stSavedSearch) {
      searchResults = search.load({
        id: stSavedSearch,
        type: stRecordType,
      });
      for (var i = 0; arrColumns != null && i < arrColumns.length; i++) {
        searchResults.columns.push(arrColumns[i]);
      }
      for (var i = 0; arrFilters != null && i < arrFilters.length; i++) {
        searchResults.filters.push(arrFilters[i]);
      }
    } else {
      searchResults = search.create({
        type: stRecordType,
        columns: arrColumns,
        filters: arrFilters,
      });
    }

    var count = 1000;
    var init = true;
    var min = 0;
    var max = 1000;

    while (count === 1000 || init) {
      var resultSet = searchResults.run().getRange({
        start: min,
        end: max,
      });

      arrResult = arrResult.concat(resultSet);
      min = max;
      max += 1000;

      init = false;
      count = resultSet.length;
    }

    return arrResult;
  }
  /* *********************** Get All Search Results - End *********************** */
  //
  /* *********************** Insert Allocation Lines - Begin *********************** */
  function insertAllocationLines(
    vendorBillRecord,
    allocationAmount,
    allocationAccount
  ) {
    var loggerTitle = ' Insert Allocation Lines ';
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Entry--------<|');

    try {
      var vbLineCount = vendorBillRecord.getLineCount({ sublistId: 'expense' });
      log.debug(loggerTitle, ' Vendor Bill Line Count: ' + vbLineCount);

      var results = getDCTAllocationList();
      log.debug(loggerTitle, ' Add Allocation DCT Line: ');

      if (vbLineCount === 0) {
        log.debug(loggerTitle, ' Adding DCT Lines ');
        addDCTLines(
          vendorBillRecord,
          results,
          allocationAmount,
          allocationAccount,
          0
        );
      } else {
        for (var index = 0; index < vbLineCount; index++) {
          if (index == vbLineCount - 1) {
            log.debug(loggerTitle, ' Adding DCT Lines ');
            addDCTLines(
              vendorBillRecord,
              results,
              allocationAmount,
              allocationAccount,
              vbLineCount
            );
          }
        }
      }
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }

    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Exit--------<|');
  }
  /* *********************** Insert Allocation Lines - End *********************** */
  //
  /* *********************** Add DCT Lines - Begin *********************** */
  function addDCTLines(
    vendorBillRecord,
    results,
    allocationAmount,
    allocationAccount,
    startIndex
  ) {
    var loggerTitle = ' Add DCT Lines ';
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Entry--------<|');

    try {
      var lastIndex = startIndex;

      for (var index1 = 0; index1 < results.length; index1++) {
        log.debug(loggerTitle, ' Inserting Line at: ' + lastIndex);
        insertLineWithValues(
          vendorBillRecord,
          results[index1],
          allocationAmount,
          allocationAccount,
          lastIndex
        );
        lastIndex += 1;
      }
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }

    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Exit--------<|');
  }
  /* *********************** Add DCT Lines  - End *********************** */
  //
  /* *********************** Insert Line With Values - Begin *********************** */
  function insertLineWithValues(
    vendorBillRecord,
    allocationData,
    allocationAmount,
    allocationAccount,
    lineIndex
  ) {
    var loggerTitle = ' Insert Line With Values ';
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Entry--------<|');

    try {
      vendorBillRecord.insertLine({
        sublistId: 'expense',
        line: lineIndex,
      });

      setLineValues(
        vendorBillRecord,
        allocationData,
        allocationAmount,
        allocationAccount
      );

      vendorBillRecord.commitLine({ sublistId: 'expense' });
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }

    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Exit--------<|');
  }
  /* *********************** Insert Line With Values  - End *********************** */
  //
  /* *********************** Set Line Values  - Begin *********************** */
  function setLineValues(
    vendorBillRecord,
    allocationData,
    allocationAmount,
    allocationAccount
  ) {
    var loggerTitle = ' Set Line Values ';
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Entry--------<|');

    try {
      vendorBillRecord.setCurrentSublistValue({
        sublistId: 'expense',
        fieldId: 'account',
        value: allocationAccount,
      });

      vendorBillRecord.setCurrentSublistValue({
        sublistId: 'expense',
        fieldId: 'location',
        value: location,
      });

      vendorBillRecord.setCurrentSublistValue({
        sublistId: 'expense',
        fieldId: 'department',
        value: allocationData.getValue('custrecord_dct_allocation_division'),
      });

      var amount =
        convertPercentageToDecimal(
          allocationData.getValue('custrecord_dct_allocation_percent')
        ) * allocationAmount;
      vendorBillRecord.setCurrentSublistValue({
        sublistId: 'expense',
        fieldId: 'amount',
        value: amount,
      });
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }

    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Exit--------<|');
  }
  /* *********************** Set Line Values - End *********************** */
  //
  /* ------------------------- Helper Functions - End------------------------ */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.pageInit = setAllocationAmounts;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
