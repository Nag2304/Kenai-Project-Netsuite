/**
 * @author Midware
 * @developer Francisco Alvarado Ferllini
 * @contact contact@midware.net
 */
define([
  'require',
  'exports',
  'N/log',
  'N/search',
  'N/https',
  'N/record',
  'N/runtime',
], function (require, exports, log, search, https, record, runtime) {
  Object.defineProperty(exports, '__esModule', { value: true });
  function getAppointmentContacts(pAppointmentId) {
    var response = { status: false, message: null, contacts: [] };
    try {
      if (pAppointmentId) {
        search
          .create({
            type: 'supportcase',
            filters: [['internalid', 'anyof', pAppointmentId]],
            columns: [
              'internalid',
              'custevent_builder_sales_rep_subd',
              'custevent7',
              'custevent_caller_name',
              search.createColumn({
                name: 'mobilephone',
                join: 'CUSTEVENT_BUILDER_SALES_REP_SUBD',
              }),
              search.createColumn({ name: 'mobilephone', join: 'CUSTEVENT7' }),
              search.createColumn({
                name: 'firstname',
                join: 'CUSTEVENT_BUILDER_SALES_REP_SUBD',
              }),
              search.createColumn({
                name: 'lastname',
                join: 'CUSTEVENT_BUILDER_SALES_REP_SUBD',
              }),
              search.createColumn({ name: 'firstname', join: 'CUSTEVENT7' }),
              search.createColumn({ name: 'lastname', join: 'CUSTEVENT7' }),
              search.createColumn({
                name: 'custrecord_agent_mobile_number',
                join: 'CUSTEVENT_CALLER_NAME',
              }),
              search.createColumn({
                name: 'custrecord_agent_first_name',
                join: 'CUSTEVENT_CALLER_NAME',
              }),
              search.createColumn({
                name: 'custrecord_agent_last_name',
                join: 'CUSTEVENT_CALLER_NAME',
              }),
            ],
          })
          .run()
          .each(function (pRow) {
            var primaryBSRId = pRow.getValue(
              'custevent_builder_sales_rep_subd'
            );
            var primaryBSRFirstName = pRow.getValue({
              name: 'firstname',
              join: 'CUSTEVENT_BUILDER_SALES_REP_SUBD',
            });
            var primaryBSRLastName = pRow.getValue({
              name: 'lastname',
              join: 'CUSTEVENT_BUILDER_SALES_REP_SUBD',
            });
            var primaryBSRName = primaryBSRFirstName + ' ' + primaryBSRLastName;
            var primaryBSRNumber = pRow.getValue({
              name: 'mobilephone',
              join: 'CUSTEVENT_BUILDER_SALES_REP_SUBD',
            });
            var agetId = pRow.getValue('custevent_caller_name');
            var agetFirstName = pRow.getValue({
              name: 'custrecord_agent_first_name',
              join: 'CUSTEVENT_CALLER_NAME',
            });
            var agetLastName = pRow.getValue({
              name: 'custrecord_agent_last_name',
              join: 'CUSTEVENT_CALLER_NAME',
            });
            var agetName = agetFirstName + ' ' + agetLastName;
            var agetNunber = pRow.getValue({
              name: 'custrecord_agent_mobile_number',
              join: 'CUSTEVENT_CALLER_NAME',
            });
            var salesManager = pRow.getValue('custevent7');
            var salesfirstName = pRow.getValue({
              name: 'firstname',
              join: 'CUSTEVENT7',
            });
            var salesLastName = pRow.getValue({
              name: 'lastname',
              join: 'CUSTEVENT7',
            });
            var salesName = salesfirstName + ' ' + salesLastName;
            var salesManagerNumber = pRow.getValue({
              name: 'mobilephone',
              join: 'CUSTEVENT7',
            });
            if (primaryBSRId && primaryBSRName && primaryBSRNumber)
              response.contacts.push({
                id: primaryBSRId,
                name: primaryBSRName,
                phone: primaryBSRNumber,
              });
            if (agetId && agetName && agetNunber)
              response.contacts.push({
                id: agetId,
                name: agetName,
                phone: agetNunber,
              });
            if (salesManager && salesName && salesManagerNumber)
              response.contacts.push({
                id: salesManager,
                name: salesName,
                phone: salesManagerNumber,
              });
            return false;
          });
      } else {
        response.status = true;
        response.message = 'Wrong Appointment Id : ' + pAppointmentId;
      }
    } catch (error) {
      response.status = true;
      response.message = 'getAppointmentData Error: ' + error.message;
      log.error('getAppointmentData', error.messag);
    }
    return response;
  }
  exports.getAppointmentContacts = getAppointmentContacts;
  function sendMessage(plogins, pMessage, pPhone, pRecipient, pAppointment) {
    var result = { status: false, message: '' };
    try {
      if (pMessage && pPhone) {
        if (plogins.length) {
          for (var x = 0; x < plogins.length; x++) {
            var username = plogins[x].username;
            var password = plogins[x].password;
            var checkaccount =
              'https://www.textmagic.com/app/api?username=' +
              username +
              '&password=' +
              password +
              '&cmd=account';
            var response = https.get({ url: checkaccount });
            if (response) {
              var body = response.body;
              var bodyjson = JSON.parse(body);
              var balance = parseFloat(bodyjson.balance)
                ? parseFloat(bodyjson.balance)
                : 0;
              log.debug(
                'checkaccount',
                'username = ' +
                  username +
                  ', password = ' +
                  password +
                  ', balance = ' +
                  balance
              );
              if (balance > 1) {
                var post = {};
                post['username'] = username;
                post['password'] = password;
                post['cmd'] = 'send';
                post['text'] =
                  pMessage + '\n\n **Please Do Not Reply To This Message.';
                post['phone'] = replaceUnwantedChar(pPhone);
                post['unicode'] = '0';
                post['max_length'] = '2';
                post['appointmentId'] = pAppointment;
                var emailresponse = https.post({
                  url: 'https://www.textmagic.com/app/api',
                  body: post,
                });
                if (emailresponse) {
                  var emailresponsebody = emailresponse.body;
                  var ebody = JSON.parse(emailresponsebody);
                  var hasmessageid = ebody.message_id;
                  if (!(hasmessageid && hasmessageid != 'undefined')) {
                    result.status = true;
                    result.message = 'It Was Not Possible To Send The Message';
                    break;
                  } else {
                    try {
                      log.debug('creating SMS log Record', 'creating');
                      var rec = record.create({
                        type: 'customrecord_mw_app_text_sms_log',
                      });
                      rec.setValue({
                        fieldId: 'custrecord_mw_sms_send_by',
                        value: runtime.getCurrentUser().id,
                      });
                      rec.setValue({
                        fieldId: 'custrecord_mw_app_sms_recipient',
                        value: pRecipient,
                      });
                      rec.setValue({
                        fieldId: 'custrecord_mw_app_sms_phone',
                        value: pPhone,
                      });
                      rec.setValue({
                        fieldId: 'custrecord_mw_app_sms_content',
                        value: pMessage,
                      });
                      rec.setValue({
                        fieldId: 'custrecord_mw_app_sms_appointment',
                        value: pAppointment,
                      });
                      rec.save();
                    } catch (error) {
                      log.error('creating SMS log Record', error.message);
                      result.status = true;
                      result.message =
                        'The Message Was Sent, But It Was Not Possible To Create The Tecord.';
                    }
                  }
                } else {
                  result.status = true;
                  result.message =
                    'It Was Not Possible To Contact The API to Send The Message';
                  break;
                }
              }
            } else {
              result.status = true;
              result.message =
                'It Was Not Possible To Contact The API To Check The Balance';
              break;
            }
          }
        }
      } else {
        result.status = true;
        result.message =
          'Information Missing: Phone: ' + pPhone + ', Message = ' + pMessage;
      }
    } catch (error) {
      log.error('sendMessage', error.messag);
      result.status = true;
      result.message = error.messag;
    }
    return result;
  }
  exports.sendMessage = sendMessage;
  function getFreeLogin() {
    var logins = [];
    search
      .create({
        type: 'customrecord_hms_magic_text_logins',
        filters: [
          ['isinactive', 'is', 'F'],
          'AND',
          ['custrecord_hms_is_blocked', 'is', 'F'],
          'AND',
          ['custrecord_hms_magic_text_username', 'is', 'textnineteen'],
        ],
        columns: [
          'internalid',
          'custrecord_hms_magic_text_username',
          'custrecord_hms_magic_text_password',
        ],
      })
      .run()
      .each(function (pRow) {
        var username = pRow.getValue('custrecord_hms_magic_text_username');
        var password = pRow.getValue('custrecord_hms_magic_text_password');
        logins.push({ username: username, password: password });
        return false;
      });
    log.debug('getFreeLogin logins', logins);
    return logins;
  }
  exports.getFreeLogin = getFreeLogin;
  function replaceUnwantedChar(pPhone) {
    var newPhone = pPhone
      .replace(/\s+/g, '')
      .replace(/\(/g, '')
      .replace(/\)/g, '')
      .replace(/[^0-9+]/g, '');
    newPhone = newPhone.substring(newPhone.length - 10, newPhone.length);
    return '1' + newPhone;
  }
});
