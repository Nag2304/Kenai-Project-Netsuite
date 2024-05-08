/**
 * This script adds a button which will call a suitelet (360CCC SL Queue Work Order Generator) that queues
 * a map reduce script (Generate Work Orders 2.0) with parameters to create work orders for a
 * single sales order.
 *
 * @copyright 2019, 360 Cloud Solutions, LLC
 * @author Matt Dahse mdahse@360cloudsolutions.com
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define([
  'N/runtime',
  'N/search',
  'N/url',
  './workOrderGeneratorUtils',
], function (runtime, search, url, woUtils) {
  const messageTypes = {
    CONFIRMATION: 0,
    INFORMATION: 1,
    WARNING: 2,
    ERROR: 3,
  };

  /**
   * This function checks the lines of the sales order to see if any are for
   * assembly items and do not have a generated work order already.
   *
   * @param rec
   * @returns {boolean}
   */
  function recordHasAssembliesWithoutWorkOrders(rec) {
    var params = { sublistId: 'item' };
    var lineCount = rec.getLineCount(params);
    for (var i = 0; i < lineCount; i++) {
      params.line = i;
      params.fieldId = 'itemtype';

      if (rec.getSublistValue(params) != 'Assembly') {
        continue;
      }
      params.fieldId = 'custcol_360_generated_wo';
      if (!rec.getSublistValue(params)) {
        return true;
      }
    }
    return false;
  }

  /**
   * This function checks the session to see if this sales order has already been submitted.
   *
   * @param rec
   * @returns {boolean}
   */
  function generationInProgress(rec) {
    if (runtime.getCurrentSession().get({ name: 'wosGenerating-' + rec.id })) {
      return true;
    }
    return false;
  }

  /**
   * This function checks a variety of conditions to determine if the Generate Work Orders button
   * should display.
   *
   * @param rec
   * @returns {boolean}
   */
  function buttonShouldDsiplay(rec) {
    var status = rec.getValue({ fieldId: 'status' });

    if (
      status !== 'Pending Fulfillment' &&
      status !== 'Pending Billing/Partially Fulfilled'
    ) {
      return false;
    }

    if (!recordHasAssembliesWithoutWorkOrders(rec)) {
      return false;
    }

    var location = rec.getValue({ fieldId: 'location' });

    if (!location) {
      return false;
    }

    /* Run the same search the map/reduce would run to check additional conditions about these lines */
    var qualifiedSoResults = woUtils.getSalesOrderLineResults({
      LOCATION: location,
      SPECIFIC_SALES_ORDER: rec.id,
    });

    if (!qualifiedSoResults.length) {
      return false;
    }

    return true;
  }

  /**
   * This function returns the URL of the suitelet which will queue the map/reduce job with
   * the parameters to ensure that only this SO is processed.
   *
   * @param rec
   * @returns {string}
   */
  function getSuiteletUrl(rec) {
    var location = rec.getValue({ fieldId: 'location' });

    var params = {
      soId: rec.id,
      location: location,
    };

    return url.resolveScript({
      scriptId: 'customscript_360_sl_queue_wo_generator',
      deploymentId: 'customdeploy_360_sl_queue_wo_generator',
      params: params,
    });
  }

  /**
   * This function displays a green banner across the top of the sales order if we have just
   * been redirected back from the Suitelet.  It also clears the session variable.
   *
   * @param context
   */
  function displayQueuedMessage(context) {
    var form = context.form;

    var message =
      'The work order generation process is queued.  Check back in a few minutes.';

    runtime
      .getCurrentSession()
      .set({ name: 'wosGenerating-' + context.newRecord.id, value: '' });

    form.addPageInitMessage({
      message: message,
      title: 'Operation In Progress',
      type: messageTypes.CONFIRMATION,
    });
  }

  /**
   * This function displays a red banner across the top of the sales order if we have just
   * been redirected back from the Suitelet and the fulfillment date is not today's date.
   *
   * @param context
   */
  function displayFulfillmentDateMessage(context) {
    var form = context.form;

    var message =
      "You will need to update the fulfillment date for this order to today's date to generate work orders today.";

    form.addPageInitMessage({
      message: message,
      title: 'Wrong Fulfillment Date',
      type: messageTypes.ERROR,
    });
  }

  /**
   * This function adds the button and sets its function to take the user agent to the suitelet
   * with the required parameters.
   *
   * @param context
   */
  function addButton(context) {
    var href = getSuiteletUrl(context.newRecord);

    context.form.addButton({
      id: 'custpage_generate_workorders',
      label: 'Generate Work Orders',
      functionName: '(window.location.assign("' + href + '"))',
    });
  }

  /**
   * This function determines if the session variable has been sent to indicate that the wrong
   * fulfillment date is present on this sales order.
   *
   * @param rec
   * @returns {boolean}
   */
  function isWrongFulfillmentDate(rec) {
    if (
      runtime
        .getCurrentSession()
        .get({ name: 'badFulfillmentDate-' + rec.id }) == 'T'
    ) {
      runtime
        .getCurrentSession()
        .set({ name: 'badFulfillmentDate-' + rec.id, value: 'F' });
      return true;
    }
    return false;
  }

  /**
   * Function definition to be triggered before record is loaded.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {string} scriptContext.type - Trigger type
   * @param {Form} scriptContext.form - Current form
   * @Since 2015.2
   */
  function beforeLoad(scriptContext) {
    if (scriptContext.type !== scriptContext.UserEventType.VIEW) {
      return;
    }

    if (generationInProgress(scriptContext.newRecord)) {
      displayQueuedMessage(scriptContext);
    } else if (buttonShouldDsiplay(scriptContext.newRecord)) {
      if (isWrongFulfillmentDate(scriptContext.newRecord)) {
        displayFulfillmentDateMessage(scriptContext);
      }
      addButton(scriptContext);
    }
  }

  return {
    beforeLoad: beforeLoad,
  };
});
