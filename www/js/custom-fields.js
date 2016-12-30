//United States, Australia, Brazil, Canada, Ireland, Germany, United Kingdom, South Korea, Singapore, India, Brazil

var URL = 'https://h09f584p6g.execute-api.ap-southeast-2.amazonaws.com/prod';

var target = '#data';
var customFields = {
	data: {
		1: {
			fullName: 'COMPANYCODE',
			prettyName: 'Company Name',
			country: 'Australia',
			fieldValue: ''
		}
	},
	xref: { // Key ['Label','column width',0|1] 1=admin only
		id: ['id', '10%',0],
		actions: ['Actions', '5%',1],
		fullName: ['FullName', '20%',0],
		prettyName: ['Pretty Name','20%',0],
		country: ['country','30%',0],
		fieldValue: ['Value','10%',0]
	},
	countries: [
		'Australia',
		'Brazil'
	],
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
}


function ajaxAllAccounts() {
	$.get(URL + '/account', function(data, status){
		console.log("Data: " + data + "\nStatus: " + status);
	});
}

ajaxAllAccounts();

function getCustomFields(id) {
	if(id) { // return requested array id
		var data = customFields.data[id];
	} else { // return all
		var data = customFields.data;
	}
	console.log(data);
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
	hdata += '</tr>\n</thead>'
	$(target).append(hdata);
	rdata += '<tbody>';
	for(key in data) {

		rdata +=('<tr data-id="' + key + '">');
		rdata +=('<td><span>id ' + key + ':</span></td>');
		if(customFields.admin) {
			rdata += '<td class="text-center"><button class="btn btn-xs btn-info" data-edit="' + key + '"><span class="fa fa-pencil"></span></button><button class="btn btn-xs btn-success" style="display:none;" data-save="' + key + '"><span class="fa fa-floppy-o"></span></button><button class="btn btn-xs btn-danger" style="display:none;" data-cancel="' + key + '"><span class="fa fa-ban"></span></button></td>';
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
					rdata += '<td><span class="field" data-field="' + subkey + '">' + countryName + '</span><select class="form-control input-sm" data-field="' + subkey + '" style="display:none;">';
					var options = buildCountrySelect(data[key][subkey],key);
					rdata += options + '</select></td>';
					break;
				default:
					rdata += '<td><span class="field" data-field="' + subkey + '">' + data[key][subkey] + '</span><input type="text" class="form-control input-sm" data-field="' + subkey + '" value="' + data[key][subkey] + '" style="display:none;" /></td>';
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
function checkForDisabled(id) {
	var value = $(target + ' tr[data-id="' + id + '"] select[data-field="country"] option:selected ').val();
	if(value == 'OEM') {
		$(target + ' tr[data-id="' + id + '"] input[data-field="fieldValue"]').prop({disabled:true});
	} else {
		$(target + ' tr[data-id="' + id + '"] input[data-field="fieldValue"]').prop({disabled:false});
	}
}
function updateFields(id,type) {
	// Read Currently stored
	var fullName = customFields.data[id].fullName;
	var prettyName = customFields.data[id].prettyName;
	var country = customFields.data[id].country;
	var fieldValue = customFields.data[id].fieldValue;

	if(type == 'save') {
		// Update from fields
		var fullName = $(target + ' tr[data-id="' + id + '"] input[data-field="fullName"]').val();
		var prettyName = $(target + ' tr[data-id="' + id + '"] input[data-field="prettyName"]').val();
		var country = $(target + ' tr[data-id="' + id + '"] select[data-field="country"] option:selected').val();
		var fieldValue = $(target + ' tr[data-id="' + id + '"] input[data-field="fieldValue"]').val();

	}
	if(type == 'cancel') {
		// Update from fields
		$(target + ' tr[data-id="' + id + '"] input[data-field="fullName"]').val(fullName);
		$(target + ' tr[data-id="' + id + '"] input[data-field="prettyName"]').val(prettyName);
		$(target + ' tr[data-id="' + id + '"] select[data-field="country"]').val(country);
		$(target + ' tr[data-id="' + id + '"] input[data-field="fieldValue"]').val(fieldValue);

	}
	// Update stored values
	var nData = {};
	nData.fullName = replaceSpecialChar(fullName);
	nData.prettyName = prettyName;
	nData.country = country;
	nData.fieldValue = fieldValue;
	customFields.data[id] = nData;
	$(target + ' tr[data-id="' + id + '"] .field[data-field="fullName"]').html(fullName);
	$(target + ' tr[data-id="' + id + '"] .field[data-field="prettyName"]').html(prettyName);
	$(target + ' tr[data-id="' + id + '"] .field[data-field="country"]').html(country);
	$(target + ' tr[data-id="' + id + '"] .field[data-field="fieldValue"]').html(fieldValue);
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
			checkForDisabled(row);
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
		checkForDisabled(id);	
	});
	$(target + ' input[data-field="fullName"]').on('focusout', function(e) {
		var value = $(this).val();
		value = replaceSpecialChar(value);
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
	buildTable(target);
	initializeToolTips();
});


//custom button
$('#add-button').on('click', function() {
	console.log('click');

	var updatedData = customFields.data;

	var newKey = Object.keys(updatedData).length + 1;
	console.log(newKey);

	updatedData[newKey] = {
		fullName: '',
		prettyName: '',
		country: '',
		fieldValue: ''
	};

	customFields.data = updatedData;

	buildTable(target);
	initializeToolTips();
})