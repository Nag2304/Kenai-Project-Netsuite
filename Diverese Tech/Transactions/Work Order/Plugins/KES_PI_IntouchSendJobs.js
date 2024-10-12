/**
 * @NApiVersion 2.x
 * @NScriptType plugintypeimpl
 */
/*global define,log*/
define([
  'N/record',
  'N/search',
  'N/task',
  'N/runtime',
  'SuiteBundles/Bundle 498594/KESINT_Library',
  'SuiteBundles/Bundle 498594/KESINT_moment',
], /**
 * @param {record} record
 * @param {search} search
 * @param {task} task
 * @param {runtime} runtime
 * @param {Object} keslibrary
 * @param {Moment} moment
 */ function (record, search, task, runtime, keslibrary, moment) {
  function runIntegration() {
    try {
      //TO-DO: Logic to get NetSuite data
      var data = getNetSuiteData();

      //TO-DO: Logic to send data to external API
      //var data = {};

      if (data.jobs.length > 0) {
        var jobs = sendExternalData({
          path: '/JobImport',
          data: JSON.stringify(data),
        });

        if (jobs) {
          jobs = JSON.parse(jobs);

          log.debug({ title: 'jobs', details: jobs });

          if (jobs.SuccessfullyImported) {
            jobs.SuccessfullyImported.forEach(function (iJob) {
              log.debug({ title: 'iJob', details: iJob });

              try {
                var i = iJob.ImportLineNumber * 1 - 1;
                var values = {
                  custbody_kes_intouchmessage: iJob.Items[0].StatusMessage,
                  custbody_kes_sendtointouch: false,
                  custbody_kes_intouchsent: true,
                };

                if (
                  iJob.Items[0].Description &&
                  iJob.Items[0].Description.indexOf('New Job GUID = ') > -1
                ) {
                  values.custbody_kes_intouchjobid =
                    iJob.Items[0].Description.replace('New Job GUID = ', '');
                }

                record.submitFields({
                  type: record.Type.WORK_ORDER,
                  id: data.jobs[i].NetSuiteID,
                  values: values,
                  options: {
                    ignoreMandatoryFields: true,
                  },
                });
              } catch (ex) {
                iJob.exception = ex;
                log.error({ title: 'JobUpdate', details: iJob });
              }
            });
          }

          if (jobs.Warnings) {
            jobs.Warnings.forEach(function (iJob) {
              log.debug({ title: 'iJob', details: iJob });

              try {
                var i = iJob.ImportLineNumber * 1 - 1;
                var values = {
                  custbody_kes_intouchmessage: iJob.Items[0].StatusMessage,
                  custbody_kes_sendtointouch: false,
                  custbody_kes_intouchsent: true,
                };

                if (iJob.Items[0].Description) {
                  values.custbody_kes_intouchmessage +=
                    ': ' + iJob.Items[0].Description;
                }

                if (iJob.Items[0].AdditionalDetails.length > 0) {
                  values.custbody_kes_intouchmessage +=
                    ':\n' + iJob.Items[0].AdditionalDetails.join('\n');
                }

                record.submitFields({
                  type: record.Type.WORK_ORDER,
                  id: data.jobs[i].NetSuiteID,
                  values: values,
                  options: {
                    ignoreMandatoryFields: true,
                  },
                });
              } catch (ex) {
                iJob.exception = ex;
                log.error({ title: 'JobUpdate', details: iJob });
              }
            });
          }

          if (jobs.Errors) {
            jobs.Errors.forEach(function (iJob) {
              log.debug({ title: 'iJob', details: iJob });

              try {
                var i = iJob.ImportLineNumber * 1 - 1;
                var values = {
                  custbody_kes_intouchmessage: iJob.Items[0].StatusMessage,
                  custbody_kes_sendtointouch: false,
                  custbody_kes_intouchsent: true,
                };

                if (iJob.Items[0].Description) {
                  values.custbody_kes_intouchmessage +=
                    ': ' + iJob.Items[0].Description;
                }

                if (iJob.Items[0].AdditionalDetails.length > 0) {
                  values.custbody_kes_intouchmessage +=
                    ':\n' + iJob.Items[0].AdditionalDetails.join('\n');
                }

                record.submitFields({
                  type: record.Type.WORK_ORDER,
                  id: data.jobs[i].NetSuiteID,
                  values: values,
                  options: {
                    ignoreMandatoryFields: true,
                  },
                });
              } catch (ex) {
                iJob.exception = ex;
                log.error({ title: 'JobUpdate', details: iJob });
              }
            });
          }
        }
      }
    } catch (ex) {
      log.error({ title: 'runIntegration', details: ex });
    }

    task
      .create({
        taskType: task.TaskType.SCHEDULED_SCRIPT,
        scriptId: 'customscript_kesint_ss_runintegration',
        deploymentId: 'customdeploy_intouchgetjobs',
      })
      .submit();
  }

  function getJobImport() {
    var data = {
      jobs: [],
      Settings: [
        { Name: '', Value: '' },
        { Name: '', Value: '' },
      ],
    };
    var jobids = [];
    var starttime = moment.utc().format('YYYY-MM-DDThh:mm:ss.SSS');

    //get the work orders
    search
      .create({
        type: 'workorder',
        filters: [
          ['type', 'anyof', 'WorkOrd'],
          'AND',
          ['mainline', 'is', 'T'],
          'AND',
          ['status', 'anyof', 'WorkOrd:B'],
          'AND',
          ['custbody_kes_sendtointouch', 'is', 'T'],
        ],
        columns: [
          'custbody_kes_intouchjobid',
          'tranid',
          'entity',
          'item',
          'quantity',
          search.createColumn({
            name: 'custitem_kes_machine',
            join: 'item',
          }),
          search.createColumn({
            name: 'custitem_kes_tool_number',
            join: 'item',
          }),
          search.createColumn({
            name: 'custitem_kes_machine_rate',
            join: 'item',
          }),
          search.createColumn({
            name: 'displayname',
            join: 'item',
          }),
          search.createColumn({
            name: 'custbody_dct_order_date',
            label: 'Order Date',
          }),
          search.createColumn({
            name: 'custbody_dct_priority',
            label: 'Priority',
          }),
          search.createColumn({
            name: 'custbody_dct_due_date',
            label: 'WO Due Date',
          }),
        ],
      })
      .run()
      .each(function (result) {
        var results = getWorkOrderLbQty(result.id);
        var quantitylbs = results.quantity;
        var materialDescription = results.description;

        var job = {
          NetSuiteID: result.id,
          JobID: '',
          Name: '',
          MachineID: '270740C6-5F21-4A13-ABC5-FF5A100CDF58',
          ToolCode: '',
          EarliestStart: starttime,
          LatestFinish: starttime,
          PlannedStart: starttime,
          PlannedFinish: starttime,
          StandardCycleTime: 0,
          SlowCycle: 0,
          FastCycle: 0,
          StoppedCycle: 0,
          VeryFastCycle: 0,
          SetupTime: 0,
          Status: 0,
          StartTime: '',
          EndTime: '',
          WorksOrders: [
            {
              WorskOrderID: '',
              JobID: '',
              OrderNumber: result.getValue({ name: 'tranid' }),
              PartCode: result.getText({ name: 'item' }),
              OrderQuantity: result.getValue({ name: 'quantity' }) * 1,
              AlreadyMade: 0,
              Description: result.getValue({
                name: 'displayname',
                join: 'item',
              }),
              ShortDescription: result.getValue({
                name: 'displayname',
                join: 'item',
              }),
              LongDescription: result.getValue({
                name: 'displayname',
                join: 'item',
              }),
              DueDate: formatDate(
                result.getValue({ name: 'custbody_dct_due_date' })
              ),
              Impressions: 0,
              PartWeight: 0,
              WasteWeight: 0,
              SellingPrice: 0,
              MaterialCost: 0,
              Material: materialDescription,
              Text: [
                '',
                result.getText({ name: 'entity' }) || '',
                '',
                result.getValue({ name: 'custbody_dct_priority' }),
                '',
                result.getValue({ name: 'custbody_dct_order_date' }),
              ],
              Number: [0],
              AdditionalText: [],
              AdditionalNumber: [0, quantitylbs || ''],
            },
          ],
          ProcessParameters: [
            {
              ParameterName: '',
              NominalValue: 0,
              USL: 0,
              LSL: 0,
              UAL: 0,
              LAL: 0,
            },
          ],
        };

        data.jobs.push(job);

        jobids.push(result.id);

        return true;
      });

    //get the tool items for the assemblies
    if (jobids.length > 0) {
      search
        .create({
          type: 'workorder',
          filters: [
            ['type', 'anyof', 'WorkOrd'],
            'AND',
            ['mainline', 'is', 'F'],
            'AND',
            ['item.type', 'anyof', 'NonInvtPart'],
            'AND',
            ['internalid', 'anyof', jobids],
          ],
          columns: [
            search.createColumn({
              name: 'linesequencenumber',
              sort: search.Sort.ASC,
            }),
            'item',
            search.createColumn({
              name: 'custitem_kes_cycletime',
              join: 'item',
            }),
            search.createColumn({
              name: 'custitem_kes_cavities',
              join: 'item',
            }),
            search.createColumn({
              name: 'itemid',
              join: 'item',
            }),
            search.createColumn({
              name: 'custitem_kes_machine',
              join: 'item',
            }),
          ],
        })
        .run()
        .each(function (result) {
          var jobid = result.id;

          data.jobs.forEach(function (job) {
            if (job.NetSuiteID == jobid && !job.ToolCode) {
              job.ToolCode = (
                result.getValue({ name: 'itemid', join: 'item' }) || ''
              ).replace('Tools : ', '');
              job.WorksOrders[0].Impressions =
                (result.getValue({
                  name: 'custitem_kes_cavities',
                  join: 'item',
                }) || '0') * 1;
              job.WorksOrders[0].Text[2] =
                result.getText({
                  name: 'custitem_kes_machine',
                  join: 'item',
                }) || '';
              job.StandardCycleTime =
                (result.getValue({
                  name: 'custitem_kes_cycletime',
                  join: 'item',
                }) || '0') * 1;
            }
          });

          return true;
        });
    }

    return data;
  }

  /**
   *
   * @returns {Object}
   */
  function getNetSuiteData() {
    return getJobImport();
  }

  /**
   *
   * @param {Object} data
   * @returns Object
   */
  function writeNetSuiteData(data) {
    return null;
  }

  function getWorkOrderLbQty(woId) {
    var resultsObj = {
      quantity: 0,
      description: '',
    };
    try {
      if (woId) {
        var workOrderRecord = record.load({
          type: record.Type.WORK_ORDER,
          id: woId,
        });
        //
        // LBS - 3
        var lbsLine = workOrderRecord.findSublistLineWithValue({
          sublistId: 'item',
          fieldId: 'units',
          value: 3,
        });
        //
        if (lbsLine !== -1) {
          resultsObj.quantity = workOrderRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: lbsLine,
          });
          resultsObj.description = workOrderRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'description',
            line: lbsLine,
          });
        }
      }
    } catch (error) {
      log.error('Get Work Order Lbs Qty Caught an exception', error);
    }
    return resultsObj;
  }

  function formatDate(orderDate) {
    var dueDate = '';
    try {
      var formattedDueDate = new Date(orderDate);
      // Extract the date parts (month, day, year)
      var month = ('0' + (formattedDueDate.getMonth() + 1)).slice(-2);
      var day = ('0' + formattedDueDate.getDate()).slice(-2);
      var year = formattedDueDate.getFullYear();

      // Format the date as MM/DD/YYYY
      var dueDateForIntouch = month + '/' + day + '/' + year;
    } catch (error) {
      log.error(' Format Date Caught with an exception', error);
    }

    return dueDate;
  }

  /**
   * @param {Object} options
   * @param {String} options.path
   * @param {Object} options.parameters
   * @returns {Object}
   */
  function getExternalData(options) {
    var getOptions = {
      name: getIntegrationName(),
      url: getExternalURL(options),
      headers: getExternalHeaders(),
    };
    var response = keslibrary.getExternalData(getOptions);

    //Optional: do something with response and return JSON object
    return response.body;
  }

  /**
   *
   * @param {Object} options
   * @param {String} options.path
   * @param {Object} options.parameters
   * @param {Object} options.data
   * @returns {String}
   */
  function sendExternalData(options) {
    var postOptions = {
      name: getIntegrationName(),
      url: getExternalURL(options),
      headers: getExternalHeaders(),
      data: options.data,
    };
    var response = keslibrary.postExternalData(postOptions);

    if (response.code == 200) {
      return response.body;
    } else {
      log.error({ title: 'sendExternalData', details: response.code });
    }

    //Optional: do something with response and return JSON object
    return null;
  }

  /**
   * @returns {String}
   */
  function getIntegrationName() {
    return 'Intouch - Send Jobs';
  }

  /**
   * @param {Object}
   * @param {String} path
   * @param {Object} parameters
   * @returns {String}
   */
  function getExternalURL(options) {
    var baseurl = 'https://i4api.intouchmonitoring.com/api';
    var requesturl = '';

    if (runtime.envType != runtime.EnvType.PRODUCTION) {
      baseurl = 'https://testintouchapi.azurewebsites.net/api';
    }

    if (options.path) {
      requesturl = baseurl + options.path;
    }

    if (options.parameters) {
      var paramstring = '';

      for (var p in options.parameters) {
        if (paramstring.length > 0) {
          paramstring += '&';
        } else {
          paramstring += '?';
        }

        paramstring += p + '=' + options.parameters[p];
      }

      requesturl = encodeURI(requesturl + paramstring);
    }

    return requesturl;
  }

  /**
   * @returns {Object}
   */
  function getExternalHeaders() {
    var authorization = 'BEARER 8B0D9943-A180-48D9-975C-7B7BBD2A0958';

    if (runtime.envType != runtime.EnvType.PRODUCTION) {
      authorization = 'BEARER B7G49LO9-GH32-47HM-LK12-RT38SV87D30P';
    }

    return {
      Authorization: authorization,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  }

  /**
   *
   * @returns {Array|Object|Search}
   */
  function getInputData() {
    return null;
    //return getExternalData();
    //return getNetSuiteData();
  }

  /**
   *
   * @param {Object} context
   * @param {String} context.type
   * @param {Boolean} context.isRestarted
   * @param {String} context.key
   * @param {String} context.value
   */
  function map(context) {
    var value = JSON.parse(context.value);
  }

  /**
   *
   * @param {Object} context
   * @param {String} context.type
   * @param {Boolean} context.isRestarted
   * @param {String} context.key
   * @param {Array} context.values
   */
  function reduce(context) {}

  function summarize(summary) {
    if (summary.inputSummary.error) {
      log.error({ title: 'getInputData', details: summary.inputSummary.error });
    }

    summary.mapSummary.errors.iterator().each(function (key, error) {
      log.error({ title: 'map-' + key, details: error });
      return true;
    });

    summary.reduceSummary.errors.iterator().each(function (key, error) {
      log.error({ title: 'reduce-' + key, details: error });
      return true;
    });

    summary.output.iterator().each(function (key, value) {
      return true;
    });
  }

  return {
    runIntegration: runIntegration,
    getIntegrationName: getIntegrationName,
    getNetSuiteData: getNetSuiteData,
    writeNetSuiteData: writeNetSuiteData,
    getInputData: getInputData,
    map: map,
    reduce: reduce,
    summarize: summarize,
  };
});
