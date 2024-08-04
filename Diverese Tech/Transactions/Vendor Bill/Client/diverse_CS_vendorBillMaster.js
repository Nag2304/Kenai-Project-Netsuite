/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */

/**
 * File name: diverse_CS_vendorBillMaster.js
 * Author           Date       Version               Remarks
 * nagendrababu  04th Aug 2024  1.00           Initial creation of the script.
 *
 */

/*global define,log*/

define([
  'N/currentRecord',
  'SuiteScripts/Transactions/Vendor Bill/Modules/diverse_Module_setAllocationAmountsOnExpensesClient',
], function (currentRecord, setAllocationAmounts) {
  /* ------------------------ Global Variables - Begin ------------------------ */
  var exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Page Init - Begin ------------------------- */
  /**
   *
   * @param {object} context
   */
  function pageInit(context) {
    var loggerTitle = ' Page Init ';
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' - Entry --------<|');
    //
    try {
      loadjQuery(function ($) {
        addButton($);
      });
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' - Exit --------<|');
  }
  /* ------------------------- Page Init - End ------------------------- */
  //
  /* ------------------------- Field Changed - Begin ------------------------- */
  function fieldChanged(context) {
    var loggerTitle = ' Field Changed ';
    var currentRecord = context.currentRecord;
    //
    var fieldId = context.fieldId;
    if (
      fieldId === 'custbody_dct_allocate' ||
      fieldId === 'custbody_dct_allocation_amount' ||
      fieldId === 'custbody_dct_allocation_acct'
    ) {
      loadjQuery(function ($) {
        addButton($);
      });
    }
  }
  /* ------------------------- Field Changed - End ------------------------- */
  //
  /* ------------------------- Helper Functions - Begin ------------------------ */
  //
  /* *********************** Load jQuery - Begin *********************** */
  function loadjQuery(callback) {
    var loggerTitle = ' Load jQuery ';
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' - Entry --------<|');
    //
    try {
      if (window.jQuery === undefined || window.jQuery.fn.jquery !== '3.6.0') {
        var script = document.createElement('script');
        script.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
        script.type = 'text/javascript';
        script.onload = function () {
          var $ = window.jQuery.noConflict(true);
          callback($);
        };
        document.getElementsByTagName('head')[0].appendChild(script);
      } else {
        callback(window.jQuery);
      }
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' - Exit --------<|');
  }
  /* *********************** Load jQuery - End *********************** */
  //
  /* *********************** Add Button - Begin *********************** */
  function addButton($) {
    var loggerTitle = ' Add Button ';
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Entry--------<|');
    //
    try {
      // Check if the button already exists
      if ($('#custpage_mybutton_add').length === 0) {
        // Add a button using jQuery
        var buttonHtml =
          '<input type="button" id="custpage_mybutton_add" value="Add" class="custom-add-button">';
        var targetField = $('#custbody_dct_allocate_fs_lbl'); // Change this to your target field's ID or class
        if (targetField.length) {
          targetField.after(buttonHtml);
          $('#custpage_mybutton_add').click(onButtonClick);

          // Inject CSS styles for the button
          injectButtonStyles();
        }
      }
      // else {
      //   log.debug(loggerTitle, 'Button already exists.');
      //   // Add any alternative logic you need here
      //   // Check for conditions and call onButtonClick if conditions are met
      //   var vbRecord = currentRecord.get();
      //   var allocateCheckboxBtn = vbRecord.getValue({
      //     fieldId: 'custbody_dct_allocate',
      //   });
      //   var allocationAmount = vbRecord.getValue({
      //     fieldId: 'custbody_dct_allocation_amount',
      //   });
      //   var allocationAccount = vbRecord.getValue({
      //     fieldId: 'custbody_dct_allocation_acct',
      //   });
      //   //
      //   log.debug(
      //     'Button Clicked',
      //     'Allocation Chkbox: ' + allocateCheckboxBtn
      //   );
      //   log.debug('Button Clicked', 'Allocation Amount: ' + allocationAmount);
      //   log.debug('Button Clicked', 'Allocation Account: ' + allocationAccount);
      //   //
      //   console.log(allocateCheckboxBtn);
      //   if (allocateCheckboxBtn && allocationAmount && allocationAccount) {
      //     onButtonClick();
      //   }
      // }
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Exit--------<|');
  }
  /* *********************** Add Button - End *********************** */
  //
  /* *********************** On Button Click - Begin *********************** */
  function onButtonClick() {
    var loggerTitle = ' On Button Click ';
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Entry--------<|');
    //
    try {
      // Add your custom logic here
      var vbRecord = currentRecord.get();
      setAllocationAmounts.pageInit(vbRecord);
      //
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Exit--------<|');
  }
  /* *********************** On Button Click - End *********************** */
  //
  /* *********************** Inject Button Styles - Begin *********************** */
  function injectButtonStyles() {
    var loggerTitle = ' Inject Button Styles ';
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Entry--------<|');
    //
    try {
      var css =
        '.custom-add-button {' +
        'background-color: #4CAF50; /* Green */' +
        'border: none;' +
        'color: white;' +
        'padding: 6px 12px;' /* Smaller padding for a smaller button */ +
        'text-align: center;' +
        'text-decoration: none;' +
        'display: inline-block;' +
        'font-size: 14px;' /* Smaller font size */ +
        'margin: 4px 2px;' +
        'cursor: pointer;' +
        'border-radius: 8px;' /* Smaller border radius */ +
        'box-shadow: 0 4px 6px 0 rgba(0,0,0,0.2);' +
        'transition: 0.3s;' +
        '}' +
        '.custom-add-button:hover {' +
        'background-color: #45a049;' +
        'box-shadow: 0 8px 12px 0 rgba(0,0,0,0.2);' +
        '}';
      var style = document.createElement('style');
      style.type = 'text/css';
      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
      document.getElementsByTagName('head')[0].appendChild(style);
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Exit--------<|');
  }
  /* *********************** Inject Button Styles - End *********************** */
  //
  /* ------------------------- Helper Functions - End ------------------------ */
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.pageInit = pageInit;
  //exports.fieldChanged = fieldChanged;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
