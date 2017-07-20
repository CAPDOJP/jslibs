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
		template:null,
		apps:{},
		config:{},
		offset:{},
		referer:{},
		requiredvalue:{},
		disabled:{
			'FILE':'添付ファイル',
			'GROUP_SELECT':'グループ選択',
			'ORGANIZATION_SELECT':'組織選択',
			'RICH_TEXT':'リッチエディター',
			'SUBTABLE':'テーブル',
			'USER_SELECT':'ユーザー選択'
		},
		fieldinfos:[],
		mappings:[],
		excludes:[
			'CALC',
			'CATEGORY',
			'CREATED_TIME',
			'CREATOR',
			'FILE',
			'GROUP_SELECT',
			'MODIFIER',
			'ORGANIZATION_SELECT',
			'RECORD_NUMBER',
			'RICH_TEXT',
			'STATUS',
			'STATUS_ASSIGNEE',
			'SUBTABLE',
			'UPDATED_TIME',
			'USER_SELECT'
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
					cell=$('<select id="'+fieldinfo.code+'" multiple="multiple">');
					cell.append($('<option>').attr('value','').text(''));
					$.each(fieldinfo.options,function(key,values){
						cell.append($('<option>').attr('value',values.label).text(values.label));
					});
					break;
				case 'DATE':
					classes='datecell';
					placeholder+=date.format('Y-m-d');
					cell=$('<input type="text" id="'+fieldinfo.code+'" placeholder="ex) '+placeholder+'">');
					break;
				case 'DATETIME':
					classes='datetimecell';
					placeholder+=date.format('Y-m-d');
					placeholder+='T'+date.getHours().toString().lpad('0',2)+':'+date.getMinutes().toString().lpad('0',2)+':'+date.getSeconds().toString().lpad('0',2)+'Z';
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
				case 'TIME':
					classes='timecell';
					placeholder+=date.getHours().toString().lpad('0',2)+':'+date.getMinutes().toString().lpad('0',2);
					cell=$('<input type="text" id="'+fieldinfo.code+'" placeholder="ex) '+placeholder+'">');
					break;
			}
			/* check mappings */
			if ($.inArray(fieldinfo.code,vars.mappings)>-1) cell.prop('disabled',true);
			/* cell events */
			cell.on('focus',function(){$(this).select();})
			.on('keyup',function(){
				var empty=true;
				$.each(vars.rows.find('tr').last().find('td'),function(index,values){
					var cell=$(this).find('input,select,texarea');
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
						$.ajax({
							url:'https://maps.googleapis.com/maps/api/geocode/json?sensor=false&language=ja&address='+encodeURI(target.val()),
							type:'get',
							datatype:'json'
						})
						.done(function(json){
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
						})
						.fail(function(){
							$.each(vars.fieldinfos,function(index,values){
								if (values.code==vars.config['lat'] || values.code==vars.config['lng'])
								{
									row.find('#'+values.code).val('');
									record[values.code]={value:functions.fieldvalue(row.find('#'+values.code),values)};
								}
							});
							functions.fieldregist(target,record,fieldinfo);
						});
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
						record[values.code]={value:functions.fieldvalue(row.find('#'+values.code),values)};
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
				case 'MULTI_SELECT':
					fieldvalue=[];
					break;
			}
			if (cell.val())
				switch (fieldinfo.type)
				{
					case 'CHECK_BOX':
					case 'MULTI_SELECT':
						$.each(cell.find('option:selected'),function(){
							fieldvalue.push($(this).attr('value'));
						});
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
								fieldvalue=[cell.find('option').eq(1).val()];
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
									fieldvalue+='T'+date.getHours().toString().lpad('0',2)+':'+date.getMinutes().toString().lpad('0',2)+':'+date.getSeconds().toString().lpad('0',2)+'Z';
								}
								else fieldvalue='1000-01-01T00:00:00Z';
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
							case 'TIME':
								if (fieldinfo.defaultExpression) fieldvalue=date.getHours().toString().lpad('0',2)+':'+date.getMinutes().toString().lpad('0',2);
								else fieldvalue='00:00';
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
						row.find('#'+values.code).val(record[values.code].value);
					});
					/* append row */
					vars.rows.append(row);
				});
				/* append new row */
				vars.rows.append(vars.template.clone(true));
				/* focus */
				vars.rows.find('input,select,texarea').first().focus();
				/* load complete */
				vars.loaded=true;
			},function(error){});
		},function(error){});
	});
})(jQuery,kintone.$PLUGIN_ID);
