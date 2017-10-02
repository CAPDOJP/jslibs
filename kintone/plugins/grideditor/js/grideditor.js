/*
*--------------------------------------------------------------------
* jQuery-Plugin "grideditor"
* Version: 1.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	/*---------------------------------------------------------------
	 valiable
	---------------------------------------------------------------*/
	var vars={
		loaded:false,
		container:null,
		grid:null,
		header:null,
		rows:null,
		selectbox:null,
		template:null,
		exports:{
			groups:[],
			organizations:[],
			users:[]
		},
		apps:{},
		config:{},
		offset:{},
		referer:{},
		requiredvalue:{},
		disabled:{
			'FILE':'添付ファイル',
			'RICH_TEXT':'リッチエディター',
			'SUBTABLE':'テーブル'
		},
		fieldinfos:[],
		mappings:[],
		excludes:[
			'CALC',
			'CATEGORY',
			'CREATED_TIME',
			'CREATOR',
			'FILE',
			'GROUP',
			'MODIFIER',
			'RECORD_NUMBER',
			'REFERENCE_TABLE',
			'RICH_TEXT',
			'STATUS',
			'STATUS_ASSIGNEE',
			'SUBTABLE',
			'UPDATED_TIME'
		]
	};
	var events={
		show:[
			'app.record.index.show'
		]
	};
	var limit=500;
	var functions={
		/* create field */
		fieldcreate:function(fieldinfo){
			var button=null;
			var cell=null;
			var classes='';
			var date=new Date();
			var placeholder='';
			switch (fieldinfo.type)
			{
				case 'CHECK_BOX':
				case 'MULTI_SELECT':
					var datasource=[fieldinfo.options.length];
					$.each(fieldinfo.options,function(key,values){
						datasource[values.index]={value:values.label,text:values.label};
					});
					classes='multiselectcell';
					cell=$('<label>');
					cell.append($('<span id="'+fieldinfo.code+'" class="customview-span">'));
					cell.append($('<input type="hidden" id="'+fieldinfo.code+'">'));
					cell.append(
						$('<button type="button" class="customview-button search-button">')
						.on('click',function(){
							var target=$(this);
							vars.selectbox.show({
								datasource:datasource,
								buttons:{
									ok:function(selection){
										target.closest('td').find('input').val(Object.keys(selection).join(','));
										target.closest('td').find('span').text(Object.values(selection).join(','));
										functions.fieldregist(target.closest('td').find('input'),{},fieldinfo);
										/* close the selectbox */
										vars.selectbox.hide();
									},
									cancel:function(){
										/* close the selectbox */
										vars.selectbox.hide();
									}
								},
								selected:target.closest('td').find('input').val().split(',')
							});
						})
					);
					break;
				case 'DATE':
					classes='datecell';
					placeholder+=date.format('Y-m-d');
					cell=$('<input type="text" id="'+fieldinfo.code+'" placeholder="ex) '+placeholder+'">');
					break;
				case 'DATETIME':
					classes='datetimecell';
					placeholder+=date.format('Y-m-d');
					placeholder+=' '+date.getHours().toString().lpad('0',2)+':'+date.getMinutes().toString().lpad('0',2);
					cell=$('<input type="text" id="'+fieldinfo.code+'" placeholder="ex) '+placeholder+'">');
					break;
				case 'DROP_DOWN':
				case 'RADIO_BUTTON':
					cell=$('<select id="'+fieldinfo.code+'">');
					cell.append($('<option>').attr('value','').text(''));
					$.each(fieldinfo.options,function(key,values){
						cell.append($('<option>').attr('value',values.label).text(values.label));
					});
					break;
				case 'GROUP_SELECT':
					/* load group datas */
					$.loadgroups(function(records){
						records.sort(function(a,b){
							if(a.id<b.id) return -1;
							if(a.id>b.id) return 1;
							return 0;
						});
						$.each(records,function(index,values){
							vars.exports.groups.push({value:values.code,text:values.name});
						});
					});
					classes='multiselectcell';
					cell=$('<label>');
					cell.append($('<span id="'+fieldinfo.code+'" class="customview-span">'));
					cell.append($('<input type="hidden" id="'+fieldinfo.code+'">'));
					cell.append(
						$('<button type="button" class="customview-button search-button">')
						.on('click',function(){
							var target=$(this);
							vars.selectbox.show({
								datasource:vars.exports.groups,
								buttons:{
									ok:function(selection){
										target.closest('td').find('input').val(Object.keys(selection).join(','));
										target.closest('td').find('span').text(Object.values(selection).join(','));
										functions.fieldregist(target.closest('td').find('input'),{},fieldinfo);
										/* close the selectbox */
										vars.selectbox.hide();
									},
									cancel:function(){
										/* close the selectbox */
										vars.selectbox.hide();
									}
								},
								selected:target.closest('td').find('input').val().split(',')
							});
						})
					);
					break;
				case 'LINK':
				case 'SINGLE_LINE_TEXT':
					if (fieldinfo.lookup)
					{
						classes='lookupcell';
						button=$('<button type="button" class="customview-button search-button">');
						/* setup required value */
						kintone.api(kintone.api.url('/k/v1/records',true),'GET',{app:fieldinfo.lookup.relatedApp.app,query:'order by $id asc'},function(resp){
							if (resp.records.length!=0) vars.requiredvalue[fieldinfo.code]=resp.records[0][fieldinfo.lookup.relatedKeyField].value;
							else vars.requiredvalue[fieldinfo.code]='';
						},function(error){});
					}
					cell=$('<input type="text" id="'+fieldinfo.code+'">');
					break;
				case 'MULTI_LINE_TEXT':
					cell=$('<textarea id="'+fieldinfo.code+'">');
					break;
				case 'NUMBER':
					if (fieldinfo.lookup)
					{
						classes='lookupcell';
						button=$('<button type="button" class="customview-button search-button">');
						/* setup required value */
						kintone.api(kintone.api.url('/k/v1/records',true),'GET',{app:fieldinfo.lookup.relatedApp.app,query:'order by $id asc'},function(resp){
							if (resp.records.length!=0) vars.requiredvalue[fieldinfo.code]=resp.records[0][fieldinfo.lookup.relatedKeyField].value;
							else vars.requiredvalue[fieldinfo.code]='';
						},function(error){});
					}
					cell=$('<input type="text" id="'+fieldinfo.code+'" class="right">');
					break;
				case 'ORGANIZATION_SELECT':
					/* load organization datas */
					$.loadorganizations(function(records){
						records.sort(function(a,b){
							if(a.id<b.id) return -1;
							if(a.id>b.id) return 1;
							return 0;
						});
						$.each(records,function(index,values){
							vars.exports.organizations.push({value:values.code,text:values.name});
						});
					});
					classes='multiselectcell';
					cell=$('<label>');
					cell.append($('<span id="'+fieldinfo.code+'" class="customview-span">'));
					cell.append($('<input type="hidden" id="'+fieldinfo.code+'">'));
					cell.append(
						$('<button type="button" class="customview-button search-button">')
						.on('click',function(){
							var target=$(this);
							vars.selectbox.show({
								datasource:vars.exports.organizations,
								buttons:{
									ok:function(selection){
										target.closest('td').find('input').val(Object.keys(selection).join(','));
										target.closest('td').find('span').text(Object.values(selection).join(','));
										functions.fieldregist(target.closest('td').find('input'),{},fieldinfo);
										/* close the selectbox */
										vars.selectbox.hide();
									},
									cancel:function(){
										/* close the selectbox */
										vars.selectbox.hide();
									}
								},
								selected:target.closest('td').find('input').val().split(',')
							});
						})
					);
					break;
				case 'TIME':
					classes='timecell';
					placeholder+=date.getHours().toString().lpad('0',2)+':'+date.getMinutes().toString().lpad('0',2);
					cell=$('<input type="text" id="'+fieldinfo.code+'" placeholder="ex) '+placeholder+'">');
					break;
				case 'USER_SELECT':
					/* load user datas */
					$.loadusers(function(records){
						records.sort(function(a,b){
							if(a.id<b.id) return -1;
							if(a.id>b.id) return 1;
							return 0;
						});
						$.each(records,function(index,values){
							vars.exports.users.push({value:values.code,text:values.name});
						});
					});
					classes='multiselectcell';
					cell=$('<label>');
					cell.append($('<span id="'+fieldinfo.code+'" class="customview-span">'));
					cell.append($('<input type="hidden" id="'+fieldinfo.code+'">'));
					cell.append(
						$('<button type="button" class="customview-button search-button">')
						.on('click',function(){
							var target=$(this);
							vars.selectbox.show({
								datasource:vars.exports.users,
								buttons:{
									ok:function(selection){
										target.closest('td').find('input').val(Object.keys(selection).join(','));
										target.closest('td').find('span').text(Object.values(selection).join(','));
										functions.fieldregist(target.closest('td').find('input'),{},fieldinfo);
										/* close the selectbox */
										vars.selectbox.hide();
									},
									cancel:function(){
										/* close the selectbox */
										vars.selectbox.hide();
									}
								},
								selected:target.closest('td').find('input').val().split(',')
							});
						})
					);
					break;
			}
			/* check mappings */
			if ($.inArray(fieldinfo.code,vars.mappings)>-1) cell.prop('disabled',true);
			/* cell events */
			cell.on('focus',function(){$(this).select();})
			.on('keyup',function(){
				var empty=true;
				$.each(vars.rows.find('tr').last().find('td'),function(index,values){
					var cell=$(this).find('input[type=text],select,textarea');
					if (cell.val())
						if (cell.val().toString().length!=0) empty=false;
				})
				/* append new row */
				if (!empty) vars.rows.append(vars.template.clone(true));
			})
			.on('change',function(){
				if (vars.loaded)
				{
					var target=$(this);
					var row=target.closest('tr');
					var record={};
					/* load lookup values */
					if (fieldinfo.lookup)
					{
						var body={
							app:fieldinfo.lookup.relatedApp.app,
							query:fieldinfo.lookup.relatedKeyField+'='+target.val()
						};
						kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
							$.each(fieldinfo.lookup.fieldMappings,function(index,values){
								row.find('#'+values.field).val(resp.records[0][values.relatedField].value);
							});
						},function(error){
							$.each(fieldinfo.lookup.fieldMappings,function(index,values){
								row.find('#'+values.field).val('');
							});
						});
					}
					/* check geocode fields */
					if (fieldinfo.code==vars.config['address'])
					{
						kintone.proxy(
							'https://maps.googleapis.com/maps/api/geocode/json?sensor=false&language=ja&address='+encodeURIComponent(target.val()),
							'GET',
							{},
							{},
							function(body,status,headers){
								if (status>=200 && status<300){
									var json=JSON.parse(body);
									switch (json.status)
									{
										case 'OK':
											row.find('#'+vars.config['lat']).val(json.results[0].geometry.location.lat);
											row.find('#'+vars.config['lng']).val(json.results[0].geometry.location.lng);
											record[vars.config['lat']]={value:row.find('#'+vars.config['lat']).val()};
											record[vars.config['lng']]={value:row.find('#'+vars.config['lng']).val()};
											break;
										default:
											$.each(vars.fieldinfos,function(index,values){
												if (values.code==vars.config['lat'] || values.code==vars.config['lng'])
												{
													row.find('#'+values.code).val('');
													record[values.code]={value:functions.fieldvalue(row.find('#'+values.code),values)};
												}
											});
											break;
									}
									functions.fieldregist(target,record,fieldinfo);
								}
							},
							function(error){
								$.each(vars.fieldinfos,function(index,values){
									if (values.code==vars.config['lat'] || values.code==vars.config['lng'])
									{
										row.find('#'+values.code).val('');
										record[values.code]={value:functions.fieldvalue(row.find('#'+values.code),values)};
									}
								});
								functions.fieldregist(target,record,fieldinfo);
							}
						);
					}
					else functions.fieldregist(target,record,fieldinfo);
				}
			});
			if (fieldinfo.lookup)
			{
				vars.apps[fieldinfo.lookup.relatedApp.app]=null;
				vars.offset[fieldinfo.lookup.relatedApp.app]=0;
				functions.loaddatas(fieldinfo.lookup.relatedApp.app,fieldinfo);
				button.on('click',function(){
					var target=$(this);
					vars.referer[fieldinfo.code].show({
						buttons:{
							cancel:function(){
								/* close the reference box */
								vars.referer[fieldinfo.code].hide();
							}
						},
						callback:function(row){
							target.closest('td').find('#'+fieldinfo.code).val(row.find('#'+fieldinfo.lookup.relatedKeyField).val()).trigger('change');
							/* close the reference box */
							vars.referer[fieldinfo.code].hide();
						}
					});
				});
				return $('<td>').addClass(classes).append(cell).append(button);
			}
			else return $('<td>').addClass(classes).append(cell);
		},
		/* get field sorted index */
		fieldsort:function(layout){
			var codes=[];
			$.each(layout,function(index,values){
				switch (values.type)
				{
					case 'ROW':
						$.each(values.fields,function(index,values){
							/* exclude spacer */
							if (!values.elementId) codes.push(values.code);
						});
						break;
					case 'GROUP':
						$.merge(codes,functions.fieldsort(values.layout));
						break;
					case 'SUBTABLE':
						codes.push(values.code);
						break;
				}
			});
			return codes;
		},
		/* register fields */
		fieldregist:function(target,record,fieldinfo){
			var row=target.closest('tr');
			var id=row.find('td').first().find('label').text();
			var method='';
			var body={};
			if (id.length!=0)
			{
				/* update */
				method='PUT';
				body={
					app:kintone.app.getId(),
					id:id,
					record:record
				};
				record[fieldinfo.code]={value:functions.fieldvalue(target,fieldinfo)};
			}
			else
			{
				/* register */
				method='POST';
				body={
					app:kintone.app.getId(),
					record:{}
				};
				$.each(vars.fieldinfos,function(index,values){
					/* check mappings */
					if ($.inArray(values.code,vars.mappings)<0)
						record[values.code]={value:functions.fieldvalue(row.find('#'+values.code).not('span'),values)};
				});
			}
			body.record=record;
			kintone.api(kintone.api.url('/k/v1/record',true),method,body,function(resp){
				row.find('td').first().find('label').text(resp.id);
			},function(error){
				swal('Error!',error.message,'error');
				target.focus();
			});
		},
		/* get field value */
		fieldvalue:function(cell,fieldinfo){
			var fieldvalue=null;
			switch (fieldinfo.type)
			{
				case 'CHECK_BOX':
				case 'GROUP_SELECT':
				case 'MULTI_SELECT':
				case 'ORGANIZATION_SELECT':
				case 'USER_SELECT':
					fieldvalue=[];
					break;
			}
			if (cell.val())
				switch (fieldinfo.type)
				{
					case 'CHECK_BOX':
					case 'MULTI_SELECT':
						fieldvalue=cell.val().split(',');
						break;
					case 'DATE':
						if (cell.val().match(/^[0-9]{4}(-|\/){1}([1-9]{1}|0[1-9]{1}|1[0-2]{1})(-|\/){1}([1-9]{1}|[0-2]{1}[0-9]{1}|3[0-1]{1})$/g)) fieldvalue=cell.val().replace(/\//g,'-');
						else
						{
							if (cell.val().match(/^[0-9]{8}$/g))
							{
								cell.val(cell.val().substr(0,4)+'-'+cell.val().substr(4,2)+'-'+cell.val().substr(6,2));
								fieldvalue=cell.val();
							}
							else cell.val('');
						}
						break;
					case 'DATETIME':
						if (cell.val().match(/^[0-9]{4}(-|\/){1}([1-9]{1}|0[1-9]{1}|1[0-2]{1})(-|\/){1}([1-9]{1}|[0-2]{1}[0-9]{1}|3[0-1]{1}) [0-9]{1,2}:[0-9]{1,2}$/g)) fieldvalue=cell.val().replace(/\//g,'-').replace(' ','T')+':00+0900';
						else
						{
							if (cell.val().match(/^[0-9]{12}$/g))
							{
								cell.val(cell.val().substr(0,4)+'-'+cell.val().substr(4,2)+'-'+cell.val().substr(6,2)+' '+cell.val().substr(8,2)+':'+cell.val().substr(10,2));
								fieldvalue=cell.val().replace(' ','T')+':00+0900';
							}
							else cell.val('');
						}
						break;
					case 'GROUP_SELECT':
					case 'ORGANIZATION_SELECT':
					case 'USER_SELECT':
						var values=cell.val().split(',');
						for (var i=0;i<values.length;i++) fieldvalue.push({code:values[i]});
						break;
					case 'RADIO_BUTTON':
						fieldvalue=(cell.val().length!=0)?cell.val():fieldinfo.defaultValue;
						break;
					case 'TIME':
						if (cell.val().match(/^[0-9]{1,2}:[0-9]{1,2}$/g)) fieldvalue=cell.val();
						else
						{
							if (cell.val().match(/^[0-9]{1,4}$/g))
							{
								cell.val(cell.val().toString().lpad('0',4));
								cell.val(cell.val().substr(0,2)+':'+cell.val().substr(2,2));
								fieldvalue=cell.val();
							}
							else cell.val('');
						}
						break;
					default:
						fieldvalue=cell.val();
						break;
				}
			if (!fieldvalue) fieldvalue='';
			if (fieldvalue.length==0)
			{
				/* check required */
				if (fieldinfo.required)
				{
					/* check default value */
					if (fieldinfo.defaultValue)
					{
						switch (fieldinfo.type)
						{
							case 'CHECK_BOX':
							case 'MULTI_SELECT':
								fieldvalue=[fieldinfo.defaultValue];
								break;
							case 'GROUP_SELECT':
							case 'ORGANIZATION_SELECT':
							case 'USER_SELECT':
								fieldvalue=[];
								$.each(fieldinfo.defaultValue,function(index,values){
									fieldvalue.push({code:values.code});
								});
								break;
							default:
								fieldvalue=fieldinfo.defaultValue;
								break;
						}
					}
					else
					{
						var date=new Date();
						switch (fieldinfo.type)
						{
							case 'CHECK_BOX':
							case 'MULTI_SELECT':
								fieldvalue=[fieldinfo.options[Object.keys(fieldinfo.options)[0]].label];
								break;
							case 'DROP_DOWN':
							case 'RADIO_BUTTON':
								fieldvalue=cell.find('option').eq(1).val();
								break;
							case 'DATE':
								if (fieldinfo.defaultExpression) fieldvalue=date.format('Y-m-d');
								else fieldvalue='1000-01-01';
								break;
							case 'DATETIME':
								if (fieldinfo.defaultExpression)
								{
									fieldvalue='';
									fieldvalue+=date.format('Y-m-d');
									fieldvalue+='T'+date.getHours().toString().lpad('0',2)+':'+date.getMinutes().toString().lpad('0',2)+':'+date.getSeconds().toString().lpad('0',2)+'+0900';
								}
								else fieldvalue='1000-01-01T00:00:00+0900';
								break;
							case 'GROUP_SELECT':
								fieldvalue=[{code:vars.exports.groups[0].value}];
								break;
							case 'LINK':
							case 'MULTI_LINE_TEXT':
							case 'SINGLE_LINE_TEXT':
								if (fieldinfo.lookup) fieldvalue=vars.requiredvalue[fieldinfo.code];
								else fieldvalue='必須項目です';
								break;
							case 'NUMBER':
								if (fieldinfo.lookup) fieldvalue=vars.requiredvalue[fieldinfo.code];
								else fieldvalue=(fieldinfo.minValue)?(fieldinfo.minValue.toString().match(/^-?[0-9]+/g))?fieldinfo.minValue:'0':'0';
								break;
							case 'ORGANIZATION_SELECT':
								fieldvalue=[{code:vars.exports.organizations[0].value}];
								break;
							case 'TIME':
								if (fieldinfo.defaultExpression) fieldvalue=date.getHours().toString().lpad('0',2)+':'+date.getMinutes().toString().lpad('0',2);
								else fieldvalue='00:00';
								break;
							case 'USER_SELECT':
								fieldvalue=[{code:vars.exports.users[0].value}];
								break;
						}
					}
				}
			}
			return fieldvalue;
		},
		loaddatas:function(appkey,fieldinfo){
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',{app:appkey,query:'order by $id asc limit '+limit.toString()+' offset '+vars.offset[appkey].toString()},function(resp){
				if (vars.apps[appkey]==null) vars.apps[appkey]=resp.records;
				else Array.prototype.push.apply(vars.apps[appkey],resp.records);
				vars.offset[appkey]+=limit;
				if (resp.records.length==limit) functions.loaddatas(appkey,fieldinfo);
				else
				{
					/* create reference box */
					vars.referer[fieldinfo.code]=$('body').referer({
						datasource:vars.apps[appkey],
						displaytext:fieldinfo.lookup.lookupPickerFields,
						searchbuttonclass:'customview-button search-button referer-button-search',
						searchbuttontext:'',
						buttons:[
							{
								id:'cancel',
								class:'customview-button referer-button-cancel',
								text:'キャンセル'
							}
						],
						searches:[
							{
								id:'multi',
								class:'referer-input-multi',
								label:'',
								type:'multi'
							}
						]
					});
					vars.referer[fieldinfo.code].searchblock.find('input#multi').closest('label').css({'width':'100%'});
				}
			},function(error){});
		}
	};
	/*---------------------------------------------------------------
	 key events
	---------------------------------------------------------------*/
	$(document).on('keydown','input[type=text],select',function(e){
		var code=e.keyCode||e.which;
		if (code==13)
		{
			var targets=$(this).closest('table').find('input[type=text]:visible:not(:disabled),select:visible:not(:disabled),textarea:visible:not(:disabled)');
			var total=targets.length;
			var index=targets.index(this);
			if (e.shiftKey)
			{
				if (index==0) index=total;
				index--;
			}
			else
			{
				index++;
				if (index==total) index=0;
			}
			targets.eq(index).focus();
			return false;
		}
	});
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* check viewid */
		if (event.viewId!=vars.config.grideditorview) return;
		/* initialize valiable */
		vars.container=$('div#grideditor-container');
		vars.grid=$('<table id="grideditor" class="customview-table">');
		vars.header=$('<tr>');
		vars.rows=$('<tbody>');
		vars.template=$('<tr>');
		vars.fieldinfos=[];
		vars.mappings=[];
		/* append elements */
		vars.grid.append($('<thead>').append(vars.header));
		vars.grid.append(vars.rows);
		vars.container.empty().append(vars.grid);
		/* fixed header */
		var headeractions=$('div.contents-actionmenu-gaia');
		var headerspace=$(kintone.app.getHeaderSpaceElement());
		headeractions.parent().css({'position':'relative'});
		headerspace.parent().css({'position':'relative'});
		$(window).on('load resize scroll',function(e){
			headeractions.css({
				'left':$(window).scrollLeft().toString()+'px',
				'position':'absolute',
				'top':'0px',
				'width':$(window).width().toString()+'px'
			});
			headerspace.css({
				'left':$(window).scrollLeft().toString()+'px',
				'position':'absolute',
				'top':headeractions.outerHeight(false)+'px',
				'width':$(window).width().toString()+'px'
			});
			vars.container.css({'margin-top':(headeractions.outerHeight(false)+headerspace.outerHeight(false))+'px','overflow-x':'visible'});
		});
		/* create selectbox */
		vars.selectbox=$('body').multiselect({
			buttons:{
				ok:{
					class:'customview-button referer-button-ok',
					text:'OK'
				},
				cancel:{
					class:'customview-button referer-button-cancel',
					text:'キャンセル'
				}
			}
		});
		/* get layout */
		kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
			var sorted=functions.fieldsort(resp.layout);
			/* get fieldinfo */
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				var displayfields=['$id'];
				/* create header and template */
				vars.header.append($('<th>').text('No'));
				vars.template.append($('<td>').append($('<label>')));
				$.each(sorted,function(index){
					var fieldinfo=resp.properties[sorted[index]];
					if (fieldinfo)
					{
						/* check disabled type */
						if (fieldinfo.type in vars.disabled)
						{
							var message='';
							message+='以下のフィールドが配置されている場合は使用出来ません。\n\n';
							$.each(vars.disabled,function(key,value){
								message+=value+'\n';
							});
							swal('Error!',message,'error');
							vars.grid.hide();
							return;
						}
						/* check exclude type */
						if ($.inArray(fieldinfo.type,vars.excludes)<0)
						{
							/* append header field */
							vars.header.append($('<th>').text(fieldinfo.label));
							/* append template field */
							vars.template.append(functions.fieldcreate(fieldinfo));
							/* append display fields */
							displayfields.push(fieldinfo.code);
							/* append fieldinfo */
							vars.fieldinfos.push(fieldinfo);
							/* append lookup mappings fields */
							if (fieldinfo.lookup)
								$.each(fieldinfo.lookup.fieldMappings,function(index,values){
									vars.mappings.push(values.field);
								});
						}
					}
				});
				/* append header field */
				vars.header.append($('<th>').text(''));
				/* append button field */
				vars.template.append($('<td class="buttoncell">')
					.append($('<button class="customview-button edit-button">').on('click',function(){
						var row=$(this).closest('tr');
						var index=row.find('td').first().find('label').text();
						if (index.length==0) window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/edit?';
						else window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/show#record='+index+'&mode=edit';
					}))
					.append($('<button class="customview-button close-button">').on('click',function(){
						var row=$(this).closest('tr');
						var index=row.find('td').first().find('label').text();
						if (index.length!=0)
						{
							swal({
								title:'確認',
								text:'削除します。\n宜しいですか?',
								type:'warning',
								showCancelButton:true,
								confirmButtonText:'OK',
								cancelButtonText:"Cancel"
							},
							function(){
								var method='DELETE';
								var body={
									app:kintone.app.getId(),
									ids:[index]
								};
								kintone.api(kintone.api.url('/k/v1/records',true),method,body,function(resp){
									row.remove();
								},function(error){});
							});
						}
					}))
				);
				/* create row */
				$.each(event.records,function(index,values){
					var record=values
					var row=vars.template.clone(true);
					/* setup field values */
					row.find('td').first().find('label').text(record['$id'].value);
					$.each(vars.fieldinfos,function(index,values){
						switch (values.type)
						{
							case 'CHECK_BOX':
							case 'MULTI_SELECT':
								row.find('input#'+values.code).val(record[values.code].value.join(','));
								row.find('span#'+values.code).text(record[values.code].value.join(','));
								break;
							case 'DATETIME':
								if (record[values.code].value.length!=0) row.find('#'+values.code).val(new Date(record[values.code].value).format('Y-m-d H:i'));
								else row.find('#'+values.code).val(record[values.code].value);
								break;
							case 'GROUP_SELECT':
							case 'ORGANIZATION_SELECT':
							case 'USER_SELECT':
								var text=[];
								var value=[];
								$.each(record[values.code].value,function(index){
									text.push(record[values.code].value[index].name);
									value.push(record[values.code].value[index].code);
								});
								row.find('input#'+values.code).val(value.join(','));
								row.find('span#'+values.code).text(text.join(','));
								break;
							default:
								row.find('#'+values.code).val(record[values.code].value);
								break;
						}
					});
					/* append row */
					vars.rows.append(row);
				});
				/* append new row */
				vars.rows.append(vars.template.clone(true));
				/* focus */
				vars.rows.find('input[type=text],select,textarea').first().focus();
				/* load complete */
				vars.loaded=true;
			},function(error){});
		},function(error){});
	});
})(jQuery,kintone.$PLUGIN_ID);
