
var target = '#data';
var customFields = {
	data: {

	},
	xref: { // Key ['Label','column width',0|1] 1=admin only
		del: ['', '%5', 1],
		id: ['id', '5%',0],
		actions: ['actions', '5%',1],
		fullName: ['full name', '20%',0],
		avatar: ['avatar','20%',0],
		country: ['country','30%',0]
	},
	countries: options.countries,
	mode: {
		row1: 'view',
		row2: 'view',
		row3: 'view',
		row4: 'view',
		row5: 'view',
		row6: 'view',
		row7: 'view',
		row8: 'view',
		row9: 'view',
	},
	multiedit: false,
	admin: true
};


function getCustomFields(id) {
	if(id) { // return requested array id
		var data = customFields.data[id];
	} else { // return all
		var data = customFields.data;
	}

	return data;
}
function replaceSpecialChar(string) {
	if(string) {
		var newString = string.replace(/ /g,'_'); // convert spaces to underscores
		newString = newString.replace(/^_+|_+$/g,''); // remove leading & trailing underscores
		newString = newString.trim();
		newString = newString.replace(/[^a-zA-Z0-9_+ ]/ig, ''); // remove special characters
		newString = newString.replace(/_+/g,'_'); // converts multiple underscores to single
		return newString.toUpperCase();
	}
}
function getTableHeaders() {
	var headers = customFields.xref;
	return headers;
}
function buildCountrySelect(selected,id) {
	var t = customFields.countries;
	var options = '';
	var limit = t.length;
	if(id > 2) { // limit OEM to Custom 1 & 2 only
		limit = limit - 1;
	}
	for(i=0;i<t.length; i++) {
		if(t[i] == selected) {
			options += '<option value="' + t[i] + '" selected>' + t[i] + '</option>'
		} else {
			options += '<option value="' + t[i] + '">' + t[i] + '</option>'
		}
	}
	return options;
}



function buildTable(target) {
	console.log('buildTable()');
	clearTable(target);
	var data = getCustomFields(); // returns array
	var header = getTableHeaders();
	var hdata = '';
	var rdata = '';
	hdata += '<thead>\n<tr>';
	for(key in header) {
		if(!customFields.admin && header[key][2] == 1) {
			delete header[key];
		} else {
			hdata += '<th width="' + header[key][1] + '">' + header[key][0] + '</th>'
		}
	}
	hdata += '</tr>\n</thead>';
	$(target).append(hdata);
	rdata += '<tbody>';

	for(key in data) {


		rdata +=('<tr data-id="' + key + '">');
		rdata +=('<td><button onclick="deleteItem(this)"delete-id=' + key + ' type="button" class="btn btn-danger">x</button></td>');
		rdata +=('<td style="vertical-align: middle"><span>' + key + '</span></td>');
		if(customFields.admin) {
			rdata += '<td class="text-center" style="vertical-align: middle"><button class="btn btn-xs btn-info" data-edit="' + key + '"><span class="fa fa-pencil"></span></button><button class="btn btn-xs btn-success" style="display:none;" data-save="' + key + '"><span class="fa fa-floppy-o"></span></button><button class="btn btn-xs btn-danger" style="display:none;" data-cancel="' + key + '"><span class="fa fa-ban"></span></button></td>';
		}
		for(subkey in data[key]) {

			switch(subkey) {


				case 'country':

					var countryName = '';
					var countryVal = '';
					$.each(customFields.countries, function(i, l) {

						if(l == data[key][subkey]) {

							countryName = customFields.countries[i];
							countryVal = customFields.countries[i];
						}
					});
					rdata += '<td style="vertical-align: middle"><span class="field" data-field="' + subkey + '">' + countryName + '</span><select class="form-control input-sm" data-field="' + subkey + '" style="display:none;">';
					var options = buildCountrySelect(data[key][subkey],key);
					rdata += options + '</select></td>';
					break;
				case 'avatar':

					rdata += '<td style="vertical-align: middle"><img data-field=' + subkey + ' style="height:35px;width:35px" src="' + data[key][subkey] + '">';
					break

				default:
					rdata += '<td style="vertical-align: middle"><span class="field" data-field="' + subkey + '">' + data[key][subkey] + '</span><input type="text" class="form-control input-sm" data-field="' + subkey + '" value="' + data[key][subkey] + '" style="display:none;" /></td>';
			}
		}
		rdata += '</tr>';
	}
	rdata +=('</tbody>');
	$(target).append(rdata);

	initializeButtons();
}
function clearTable(target) {
	$(target).empty();
}
function resetForm(target) {
	var currentID = $(target + ' tfoot tr').data('id');
	var newID = parseInt(currentID) + 1;
	$(target + ' tfoot tr').attr('data-id', newID);
}

function updateFields(id,type) {
	// Read Currently stored
	console.log(id);
	console.log(customFields.data);
	var fullName = customFields.data[id].fullName;
	var avatar = customFields.data[id].avatar;
	var country = customFields.data[id].country;


	if(type == 'save') {
		console.log('doing save');
		// Update from fields
		var fullName = $(target + ' tr[data-id="' + id + '"] input[data-field="fullName"]').val();
		var avatar = $(target + ' tr[data-id="' + id + '"] img[data-field="avatar"]').attr('src');
		var country = $(target + ' tr[data-id="' + id + '"] select[data-field="country"] option:selected').val();

		ajaxPUTAccount({
			id: id,
			full_name: fullName,
			country: country,
			avatar: avatar
		})
	}
	if(type == 'cancel') {
		// Update from fields
		$(target + ' tr[data-id="' + id + '"] input[data-field="fullName"]').val(fullName);
		$(target + ' tr[data-id="' + id + '"] input[data-field="avatar"]').val(avatar);
		$(target + ' tr[data-id="' + id + '"] select[data-field="country"]').val(country);

	}
	// Update stored values
	var nData = {};
	nData.fullName = fullName;
	nData.avatar = avatar;
	nData.country = country;
	customFields.data[id] = nData;
	$(target + ' tr[data-id="' + id + '"] .field[data-field="fullName"]').html(fullName);
	$(target + ' tr[data-id="' + id + '"] .field[data-field="avatar"]').attr('src', avatar);
	$(target + ' tr[data-id="' + id + '"] .field[data-field="country"]').html(country);
};
function toggleRow(row) {
	$(target + ' tr[data-id="' + row + '"]').toggleClass('success');
	$(target + ' tr[data-id="' + row + '"] td button[data-edit]').toggle();
	$(target + ' tr[data-id="' + row + '"] td button[data-save]').toggle();
	$(target + ' tr[data-id="' + row + '"] td button[data-cancel]').toggle();
	$(target + ' tr[data-id="' + row + '"] td').children('input:not([type="checkbox"])').toggle();
	$(target + ' tr[data-id="' + row + '"] td').children('select').toggle();
	$(target + ' tr[data-id="' + row + '"] td').children('span.field').toggle();
}
function changeMode(row,element,type) {
	console.log('changeMode()');
	switch(type) {
		case 'edit' : //
			toggleRow(row);
			break;
		case 'save' :
			updateFields(row,type);
			toggleRow(row);
			break;
		case 'cancel' :
			updateFields(row,type);
			toggleRow(row);
		default :
			break;
	}
}
function initializeButtons() {
	console.log('initializeButtons()');
	$(target + ' select[data-field="country"]').on('change', function(e) {
		e.preventDefault();
		var id = $(this).parent().parent().data('id');
	});
	$(target + ' input[data-field="fullName"]').on('focusout', function(e) {
		var value = $(this).val();
		value = value;
		$(this).val(value);
	})
	$('button[data-edit]').on('click', function(e) {
		e.preventDefault();
		var row = $(this).data('edit');
		customFields.mode['row' + row] = 'edit';
		changeMode(row,$(this),'edit');
	})
	$('button[data-cancel]').on('click', function(e) {
		e.preventDefault();
		var row = $(this).data('cancel');
		customFields.mode['row' + row] = 'cancel';
		changeMode(row,$(this),'cancel');
	})
	$('button[data-save]').on('click', function(e) {
		e.preventDefault();
		var row = $(this).data('save');
		customFields.mode['row' + row] = 'save';
		changeMode(row,$(this),'save');
	})
}
function initializeToolTips() {
	console.log('initializeToolTips()');
	$('button[data-cancel]').tooltip({
		placement: 'top',
		title: 'Cancel',
		delay: {show: 800, hide: 0}
	});
	$('button[data-edit]').tooltip({
		placement: 'top',
		title: 'Edit',
		delay: {show: 800, hide: 0}
	});
	$('button[data-save]').tooltip({
		placement: 'top',
		title: 'Save',
		delay: {show: 800, hide: 0}
	});
}

$( document ).ready(function() {
	initializeToolTips();

  var apigurl = localStorage.getItem('apigurl');
  console.log(apigurl);

	if (apigurl !=null ) {
		$('#URLInput').val(apigurl);
	}
});


function id() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4();
}



//add row button
$('#add-button').on('click', function() {
	addRow();
});

$('#refresh-button').on('click', function() {
  customFields.data = {};
	buildTable(target);
	ajaxAllAccounts();
});




function addRow() {

	var new_record = {};
	new_record.fullName = '';
	new_record.avatar = '';
	new_record.country = '';

	var data = {};
	var key = id();
	data[key] = new_record;

	var rdata = '';

	//need to get this 'data'

	for(key in data) {

		rdata +=('<tr data-id="' + key + '">');
		rdata +=('<td><button onclick="deleteItem(this)"delete-id=' + key + ' type="button" class="btn btn-danger">x</button></td>');
		rdata +=('<td style="vertical-align: middle"><span>' + key + '</span></td>');
		if(customFields.admin) {
			rdata += '<td class="text-center" style="vertical-align: middle"><button class="btn btn-xs btn-info" data-edit="' + key + '"><span class="fa fa-pencil"></span></button><button class="btn btn-xs btn-success" style="display:none;" data-save="' + key + '"><span class="fa fa-floppy-o"></span></button><button class="btn btn-xs btn-danger" style="display:none;" data-cancel="' + key + '"><span class="fa fa-ban"></span></button></td>';
		}
		for(subkey in data[key]) {

			switch(subkey) {

				case 'country':

					rdata += '<td style="vertical-align: middle"><span class="field" data-field="' + subkey + '">	</span><select class="form-control input-sm" data-field="' + subkey + '" style="display:none;">';
					var options = buildCountrySelect(data[key][subkey],key);
					rdata += options + '</select></td>';

					break;
				case 'avatar':

					rdata += '<td style="vertical-align: middle"><img src="https://robohash.org/' + key + '.png" data-field=' + subkey + ' style="height:35px;width:35px" /></td>';
					break;

				default:
					rdata += '<td style="vertical-align: middle"><span class="field" data-field="' + subkey + '">' + data[key][subkey] + '</span><input type="text" class="form-control input-sm" data-field="' + subkey + '" value="' + data[key][subkey] + '" style="display:none;" /></td>';
			}
		}
		rdata += '</tr>';
	}



	rdata +=('</tbody>');
	$(target).append(rdata);

	initializeButtons();

	//do the POST to create the item
	ajaxPOSTAccount({
		id: key,
		full_name: '-',
		country: '-',
		avatar: 'https://robohash.org/' + key + '.png'
	}, function(record) {
		  console.log('callback');
			console.log(record);

			customFields.data[record.id] = {
				fullName: record.full_name,
				avatar: record.avatar,
				country: record.country
			}
	});
}

function deleteItem(e) {
	console.log("deleteItem()");
	var id = $(e).attr('delete-id');

	//1. call API to delete
	$.ajax({
    url: URL + '/account/' + id,
    type: 'DELETE',
    success: function(result) {
        console.log(result);
				if(result.success) {
					  delete customFields.data[id];
						$('tr[data-id=' + id + ']').remove();
				}
    }
  });
}

function getAPIGURL() {
	var url = $('#URLInput').val();
	localStorage.setItem('apigurl', url);
	return url;
}


/***
 * AJAX stuff
 */


function ajaxAllAccounts() {
	console.log('ajaxAllAccounts()');
	$.get( getAPIGURL() + '/account', function(data, status){
		console.log("Data: " + data + "\nStatus: " + status);

		console.log(data.accounts);

		for(i=0;i<data.accounts.length; i++) {
			console.log(data.accounts[i]);

			if(data.accounts[i].full_name == '-') {
				data.accounts[i].full_name = '';
			}

			customFields.data[data.accounts[i].id] = {
				fullName: data.accounts[i].full_name,
				avatar: data.accounts[i].avatar,
				country: data.accounts[i].country
			}
			delete data.accounts[i].id;
		}

		console.log(JSON.stringify(customFields.data));
		buildTable(target);
	});
}

function ajaxPUTAccount(record) {

	id = record.id;
	delete record.id

	$.ajax({
    url: getAPIGURL() + '/account/' + id,
    type: 'PUT',
		data: JSON.stringify(record),
    success: function(result) {
        console.log(result);
				if(result.success) {
					  console.log('updated');
				}
    }
  });
}

function ajaxPOSTAccount(record, cb) {
    console.log('ajaxPOSTAccount()');

		//https://forums.aws.amazon.com/thread.jspa?threadID=90137
		$.post( getAPIGURL() + '/account', JSON.stringify(record)).done(function( data ) {
		    console.log("Data Loaded: " + JSON.stringify(data));
				cb(record);
  });
}
