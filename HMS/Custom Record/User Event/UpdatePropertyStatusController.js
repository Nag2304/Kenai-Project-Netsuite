/**
 * @author Midware
 * @Website www.midware.net
 * @Developer Reinaldo Stephens Chaves
 * @contact contact@midware.net
 */
define([
  'require',
  'exports',
  'N/log',
  'N/record',
  'N/redirect',
  '../../Global/Constants',
  '../Views/UpdatePropertyStatusView',
  '../Models/UpdatePropertyStatusModel',
], function (
  require,
  exports,
  log,
  record,
  redirect,
  Constants,
  UpdatePropertyStatusView,
  UpdatePropertyStatusModel
) {
  Object.defineProperty(exports, '__esModule', { value: true });
  exports.okSubmitterForm =
    exports.submitForm =
    exports.createForm =
    exports.displayResult =
    exports.getForm =
      void 0;
  /**
   * Renders the main Form to change the sale status.
   * @param propertyId - Identifier of the Property Record.
   * @param msg - Message.
   * @returns {serverWidget.Form} Form.
   */
  function getForm(propertyId, msg) {
    log.debug('Controller', 'Getting Form');
    var currentPropertyStatus =
      UpdatePropertyStatusModel.getCurrentPropertyStatus(propertyId);
    return UpdatePropertyStatusView.createForm(
      propertyId,
      msg,
      currentPropertyStatus
    );
  }
  exports.getForm = getForm;
  /**
   * Redirects to the suitelet after change the property sale status and click proceed button.
   * @param {string} propertyId - Property Record Identifier.
   * @param {string} newStatus - New property sale status.
   * @param {string} oldStatus - Old property sale status.
   * @param {string} urlSource - To track the source of the update.
   */
  function displayResult(propertyId, newStatus, oldStatus, urlSource) {
    log.debug('Controller', 'Display result');
    log.debug(
      'Proceed Case',
      'Old Status: '
        .concat(oldStatus, ', New Status: ')
        .concat(newStatus, ', urlSource: ')
        .concat(urlSource)
    );
    log.debug('urlParams ', urlSource);
    log.debug(
      'Controller displayResult Constants.urlSource: ',
      Constants.urlSource
    );
    var param = {
      houseno: propertyId,
      oldStatus: oldStatus,
      newStatus: newStatus,
      urlSource: urlSource,
    };
    log.debug('Redirecting to the Suitelet with params: ', param);
    //
    if (oldStatus !== newStatus) {
      var propertyRecord = record.load({
        type: 'customrecord_property_record',
        id: propertyId,
      });
      var clientStatus = propertyRecord.getValue({
        fieldId: 'custrecord_user_entered_sales_status',
      });
      log.debug('displayResult Function', {
        currentClientStatus: clientStatus,
        newSts: newStatus,
      });
      if (newStatus !== clientStatus) {
        propertyRecord.setValue({
          fieldId: 'custrecord_user_entered_sales_status',
          value: newStatus,
        });
        propertyRecord.save();
      }
    }
    redirect.toSuitelet({
      scriptId: Constants.SUITELET_SCRIPT_ID,
      deploymentId: '1',
      parameters: param,
    });
  }
  exports.displayResult = displayResult;
  /**
   * Creates a form dynamically depending on the status.
   * @param {string} propertyId - Property Record Identifier.
   * @param {string} newStatus - New property sale status.
   * @param {string} oldStatus - Old property sale status.
   * @returns {serverWidget.Form} Form.
   */
  function createForm(oldStatus, newStatus, propertyId, urlSource) {
    log.debug('Controller', 'Creating Form');
    var result = null;
    var propertyRecord = null;
    var propertyDataJSON = {};
    var searchObject =
      UpdatePropertyStatusModel.createPropertySearch(propertyId);
    log.debug(
      'Controller createForm Constants.urlSource: ',
      Constants.urlSource
    );
    if (searchObject) {
      var propertySearchResults = searchObject
        .run()
        .getRange({ start: 0, end: 1 });
      log.debug('Search Result', propertySearchResults);
      if (propertySearchResults.length > 0) {
        var internalId = propertySearchResults[0]
          .getValue(Constants.PROPERTY_RECORD.internalid)
          .toString();
        propertyRecord = record.load({
          id: internalId,
          type: Constants.PROPERTY_RECORD.type,
        });
      }
    }
    if (propertyRecord) {
      propertyDataJSON =
        UpdatePropertyStatusModel.getPropertyRecordData(propertyRecord);
      if (
        (oldStatus == Constants.SALES_STATUS_LIST.available.value ||
          oldStatus ==
            Constants.SALES_STATUS_LIST.pendingAwaitingContract.value) &&
        newStatus == Constants.SALES_STATUS_LIST.pending.value
      ) {
        // if the status of the sale of the property changes from available to pending.
        result = UpdatePropertyStatusView.availableToPendingForm(
          propertyId,
          propertyDataJSON,
          newStatus,
          urlSource
        );
      } else if (
        (oldStatus == Constants.SALES_STATUS_LIST.pending.value &&
          newStatus == Constants.SALES_STATUS_LIST.available.value) ||
        (oldStatus ==
          Constants.SALES_STATUS_LIST.pendingAwaitingContract.value &&
          newStatus == Constants.SALES_STATUS_LIST.available.value)
      ) {
        // if the status of the sale of the property changes from pending to available.
        // or if the status of the sale of the property changes from available to pending awaiting contract.
        result = UpdatePropertyStatusView.backOnMarketForm(
          propertyId,
          propertyDataJSON,
          newStatus,
          urlSource
        );
      } else if (
        oldStatus == Constants.SALES_STATUS_LIST.available.value &&
        newStatus == Constants.SALES_STATUS_LIST.pendingAwaitingContract.value
      ) {
        // if the status of the sale of the property changes from available or PendingAwaitingContract to Pending
        result =
          UpdatePropertyStatusView.availableToPendingAwaitingContractForm(
            propertyId,
            propertyDataJSON,
            newStatus,
            urlSource
          );
      } else if (
        (oldStatus == Constants.SALES_STATUS_LIST.available.value ||
          oldStatus == Constants.SALES_STATUS_LIST.pending.value ||
          oldStatus ==
            Constants.SALES_STATUS_LIST.pendingAwaitingContract.value) &&
        (newStatus == Constants.SALES_STATUS_LIST.withdrawn.value ||
          newStatus == Constants.SALES_STATUS_LIST.canceled.value)
      ) {
        // if the status of the sale of the property changes from available or pending
        // to withdrawn or canceled.
        result =
          UpdatePropertyStatusView.availableOrPendingToWithdrawnOrCanceledForm(
            propertyId,
            propertyDataJSON,
            newStatus,
            urlSource
          );
      } else if (
        (oldStatus == Constants.SALES_STATUS_LIST.pending.value ||
          oldStatus ==
            Constants.SALES_STATUS_LIST.pendingAwaitingContract.value) &&
        newStatus == Constants.SALES_STATUS_LIST.closed.value
      ) {
        // if the status of the sale of the property changes from pending to closed.
        result = UpdatePropertyStatusView.pendingToClosedForm(
          propertyId,
          propertyDataJSON,
          newStatus,
          urlSource
        );
      } else if (
        oldStatus == Constants.SALES_STATUS_LIST.canceled.value &&
        newStatus == Constants.SALES_STATUS_LIST.available.value
      ) {
        // if the status of the sale of the property changes from canceled to available.
        result = UpdatePropertyStatusView.canceledToAvailableForm(
          propertyId,
          propertyDataJSON,
          urlSource
        );
      } else {
        // redirect to the Suitelet
        log.debug('Redirect to the Suitelet', 'This change is not allowed');
        var param = {
          houseno: propertyId,
          msg: 'This change is not allowed',
          urlSource: urlSource,
        };
        redirect.toSuitelet({
          scriptId: Constants.SUITELET_SCRIPT_ID,
          deploymentId: '1',
          parameters: param,
        });
      }
    }
    return result;
  }
  exports.createForm = createForm;
  /**
   * Submits the form data and updates the property record.
   * @param {any} params - Request parameters.
   * @param {file.File} purchaseContract - Request file.
   * @param {file.File} hud1 - Request file.
   * @param {file.File} closedPrintfull1 - Request file.
   * @param {file.File} closedPrintfull2 - Request file.
   * @returns {serverWidget.Form} Form.
   */
  function submitForm(
    params,
    purchaseContract,
    hud1,
    closedPrintfull1,
    closedPrintfull2,
    pendingPrintfull1,
    pendingPrintfull2
  ) {
    log.debug('Controller', 'Submiting form');
    log.debug('Controller submitForm params: ', params);
    var form = null;
    var propertyRecordUpdatedId = 0;
    var propertyId = params.custpage_internalid;
    var newStatus = params.custpage_salesstatus;
    var urlSource = params.custpage_urlsource;
    var currentPropertyStatus =
      UpdatePropertyStatusModel.getCurrentPropertyStatus(propertyId);
    log.debug(
      'Controller submitForm Constants.urlSource: ',
      Constants.urlSource
    );
    log.debug(
      'Submit Case',
      'Current Status: '
        .concat(currentPropertyStatus, ', New Status: ')
        .concat(newStatus, ' urlSource ')
        .concat(urlSource)
    );
    log.debug('Property Id', propertyId);
    if (
      (currentPropertyStatus == Constants.SALES_STATUS_LIST.available.value ||
        currentPropertyStatus ==
          Constants.SALES_STATUS_LIST.pendingAwaitingContract.value) &&
      newStatus == Constants.SALES_STATUS_LIST.pending.value
    ) {
      // if the status of the sale of the property changes from available to pending.
      propertyRecordUpdatedId =
        UpdatePropertyStatusModel.submitAvailableToPendingProceedForm(
          params,
          purchaseContract,
          pendingPrintfull1,
          pendingPrintfull2,
          newStatus
        );
    } else if (
      (currentPropertyStatus == Constants.SALES_STATUS_LIST.pending.value ||
        currentPropertyStatus ==
          Constants.SALES_STATUS_LIST.pendingAwaitingContract.value) &&
      newStatus == Constants.SALES_STATUS_LIST.available.value
    ) {
      // if the status of the sale of the property changes from pending to available.
      // or if the status of the sale of the property changes from available to pending awaiting contract.
      var formNumber =
        Constants.FORMS.pendingOrPendingAwaitingContractToAvailable;
      propertyRecordUpdatedId =
        UpdatePropertyStatusModel.submitBackOnMarketProceedForm(
          params,
          propertyId,
          newStatus,
          formNumber,
          null
        );
    } else if (
      (currentPropertyStatus == Constants.SALES_STATUS_LIST.available.value ||
        currentPropertyStatus == Constants.SALES_STATUS_LIST.pending.value) &&
      (newStatus == Constants.SALES_STATUS_LIST.withdrawn.value ||
        currentPropertyStatus == Constants.SALES_STATUS_LIST.canceled.value)
    ) {
      // if the status of the sale of the property changes from available or pending
      // to withdrawn or canceled.
      var formNumber = Constants.FORMS.availableOrPendingToWithdrawnOrCanceled;
      var listingNotes = params.custpage_listing_notes;
      propertyRecordUpdatedId =
        UpdatePropertyStatusModel.submitBackOnMarketProceedForm(
          params,
          propertyId,
          newStatus,
          formNumber,
          listingNotes
        );
    } else if (
      currentPropertyStatus == Constants.SALES_STATUS_LIST.available.value &&
      newStatus == Constants.SALES_STATUS_LIST.pendingAwaitingContract.value
    ) {
      // if the status of the sale of the property changes from available or pending
      // to withdrawn or canceled.
      var formNumber = Constants.FORMS.availableToPendingAwaitingContract;
      //let listingNotes = params.custpage_listing_notes;
      log.debug('Property Id', propertyId);
      propertyRecordUpdatedId =
        UpdatePropertyStatusModel.submitBackOnMarketProceedForm(
          params,
          propertyId,
          newStatus,
          formNumber,
          null
        );
    } else if (
      currentPropertyStatus == Constants.SALES_STATUS_LIST.pending.value &&
      newStatus == Constants.SALES_STATUS_LIST.closed.value
    ) {
      // if the status of the sale of the property changes from pending to closed.
      propertyRecordUpdatedId =
        UpdatePropertyStatusModel.submitPendingToClosedProceedForm(
          params,
          hud1,
          closedPrintfull1,
          closedPrintfull2,
          newStatus
        );
    } else if (
      currentPropertyStatus == Constants.SALES_STATUS_LIST.canceled.value &&
      newStatus == Constants.SALES_STATUS_LIST.available.value
    ) {
      // if the status of the sale of the property changes from canceled to available.
      propertyRecordUpdatedId =
        UpdatePropertyStatusModel.submitCanceledToAvailableProceedForm(
          params,
          newStatus
        );
      UpdatePropertyStatusModel.checkAMD(params, params.custpage_internalid);
    }
    log.debug('Record Id', propertyRecordUpdatedId);
    if (
      currentPropertyStatus == Constants.SALES_STATUS_LIST.pending.value &&
      newStatus == Constants.SALES_STATUS_LIST.available.value
    ) {
      form = UpdatePropertyStatusView.successPendingToAvailableForm(
        propertyRecordUpdatedId
      );
    } else {
      form = UpdatePropertyStatusView.successDefaultForm(
        propertyRecordUpdatedId
      );
    }
    return form;
  }
  exports.submitForm = submitForm;
  function okSubmitterForm() {
    return UpdatePropertyStatusView.okSubmitterForm();
  }
  exports.okSubmitterForm = okSubmitterForm;
});
