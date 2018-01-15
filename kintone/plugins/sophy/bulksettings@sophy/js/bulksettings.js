/*
*--------------------------------------------------------------------
* jQuery-Plugin "bulksettings"
* Version: 1.0
* Copyright (c) 2017 TIS
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
		bulks:null,
		bulkinfos:[]
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var functions={
		fieldmapping:function(fieldinfos){
			var mappings=[];
			$.each(fieldinfos,function(key,values){
				switch (values.type)
				{
					case 'SUBTABLE':
						$.merge(mappings,functions.fieldmapping(values.fields));
						break;
					default:
						if (values.lookup)
							$.each(values.lookup.fieldMappings,function(index,values){
								mappings.push(values.field);
							});
						break;
				}
			});
			return mappings;
		},
		fieldsort:function(layout){
			var codes=[];
			$.each(layout,function(index,values){
				switch (values.type)
				{
					case 'ROW':
						$.each(values.fields,function(index,values){
							/* exclude spacer */
							if (!values.elementId) codes.push({code:values.code,cells:[]});
						});
						break;
					case 'GROUP':
						$.merge(codes,functions.fieldsort(values.layout));
						break;
					case 'SUBTABLE':
						var cells=[];
						$.each(values.fields,function(index,values){
							/* exclude spacer */
							if (!values.elementId) cells.push(values.code);
						});
						codes.push({code:values.code,cells:cells});
						break;
				}
			});
			return codes;
		},
		formatvalue:function(fieldinfo,record){
			var contents=$('#'+fieldinfo.code,vars.bulks.contents);
			var receivevalue=contents.find('.receiver').val();
			var receivevalues=[];
			switch (fieldinfo.type)
			{
				case 'CHECK_BOX':
				case 'MULTI_SELECT':
					$.each(contents.find('.receiver:checked'),function(){receivevalues.push($(this).val());});
					if (receivevalues.length!=0) record[fieldinfo.code].value=receivevalues;
					break;
				case 'GROUP_SELECT':
				case 'ORGANIZATION_SELECT':
				case 'USER_SELECT':
					if (receivevalue.length!=0)
					{
						var values=receivevalue.split(',');
						for (var i2=0;i2<values.length;i2++) receivevalues.push({code:values[i2]});
						record[fieldinfo.code].value=receivevalues;
					}
					break;
				default:
					if (receivevalue.length!=0) record[fieldinfo.code].value=receivevalue;
					break;
			}
		},
		loadfieldinfos:function(){
			if (vars.bulks) return;
			vars.bulkinfos=[];
			/* get layout */
			kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
				var sorted=functions.fieldsort(resp.layout);
				/* get fieldinfo */
				kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
					var fieldinfos=resp.properties;
					var mappings=functions.fieldmapping(resp.properties);
					$.each(sorted,function(index){
						var fieldcode=sorted[index];
						if (fieldcode.code in fieldinfos)
						{
							var fieldinfo=fieldinfos[fieldcode.code];
							if (fieldinfo.type=='SUBTABLE')
							{
								for (var i=0;i<fieldcode.cells.length;i++)
								{
									var cellinfo=$.extend(true,{},fieldinfo.fields[fieldcode.cells[i]]);
									if (cellinfo.type!='FILE' && cellinfo.type!='RADIO_BUTTON')
										if ($.inArray(fieldcode.cells[i],mappings)<0)
										{
											cellinfo['tablecode']=fieldcode.code;
											vars.bulkinfos.push(cellinfo);
										}
								}
							}
							else
							{
								if (fieldinfo.type!='FILE' && fieldinfo.type!='RADIO_BUTTON')
									if ($.inArray(fieldinfo.code,mappings)<0)
									{
										fieldinfo['tablecode']='';
										vars.bulkinfos.push($.extend(true,{},fieldinfo));
									}
							}
						}
					});
					if (!$('.bulkbutton',$('body')).size())
					{
						var button=$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/edit.svg" class="bulkbutton" alt="フィールド一括更新" title="フィールド一括更新" />').css({
							'cursor':'pointer',
							'display':'inline-block',
							'height':'48px',
							'margin':'0px 12px',
							'vertical-align':'top',
							'width':'48px'
						})
						.on('click',function(e){
							var values={};
							for (var i=0;i<vars.bulkinfos.length;i++)
							{
								var fieldinfo=vars.bulkinfos[i];
								switch (fieldinfo.type)
								{
									case 'CHECK_BOX':
									case 'GROUP_SELECT':
									case 'MULTI_SELECT':
									case 'ORGANIZATION_SELECT':
									case 'USER_SELECT':
										values[fieldinfo.code]={
											type:fieldinfo.type,
											value:[]
										};
										break;
									default:
										values[fieldinfo.code]={
											type:fieldinfo.type,
											value:''
										};
										break;
								}
							}
							vars.bulks.show({
								buttons:{
									ok:function(){
										/* close the bulks */
										vars.bulks.hide();
										swal({
											title:'確認',
											text:'更新します。\n宜しいですか?',
											type:'warning',
											showCancelButton:true,
											confirmButtonText:'OK',
											cancelButtonText:"キャンセル"
										},
										function(){
											functions.showloading();
											kintone.api(kintone.api.url('/k/v1/records',true),'GET',{app:kintone.app.getId(),query:kintone.app.getQuery()},function(resp){
												var counter=resp.records.length;
												var error=false;
												var body={
													app:kintone.app.getId(),
													records:[]
												};
												for (var i=0;i<resp.records.length;i++)
												{
													if (error) break;
													var record={};
													$.each(resp.records[i],function(key,values){
														switch (values.type)
														{
															case 'CALC':
															case 'CATEGORY':
															case 'CREATED_TIME':
															case 'CREATOR':
															case 'FILE':
															case 'MODIFIER':
															case 'RECORD_NUMBER':
															case 'STATUS':
															case 'STATUS_ASSIGNEE':
															case 'UPDATED_TIME':
																break;
															default:
																record[key]=values;
																break;
														}
													});
													for (var i2=0;i2<vars.bulkinfos.length;i2++)
													{
														var fieldinfo=vars.bulkinfos[i2];
														if (fieldinfo['tablecode'].length!=0)
														{
															var tablecode=fieldinfo['tablecode'];
															for (var i3=0;i3<record[tablecode].value.length;i3++)
															{
																var cells=record[tablecode].value[i3].value;
																functions.formatvalue(fieldinfo,cells);
															}
														}
														else functions.formatvalue(fieldinfo,record);
													}
													body.records.push({
														id:record['$id'].value,
														record:record
													});
													kintone.api(kintone.api.url('/k/v1/records',true),'PUT',body,function(resp){
														counter--;
														if (counter==0)
														{
															functions.hideloading();
															swal({
																title:'更新完了',
																text:'更新完了',
																type:'success'
															},function(){location.reload(true);});
														}
													},function(error){
														functions.hideloading();
														swal('Error!',error.message,'error');
														error=true;
													});
												}
											},function(error){
												functions.hideloading();
												swal('Error!',error.message,'error');
											});
										});
									},
									cancel:function(){
										/* close bulks */
										vars.bulks.hide();
									}
								},
								values:values
							});
						});
						kintone.app.getHeaderMenuSpaceElement().appendChild(button[0]);
					}
					vars.bulks=$('body').fieldsform({
						buttons:{
							ok:{
								text:'OK'
							},
							cancel:{
								text:'キャンセル'
							}
						},
						fields:vars.bulkinfos
					});
				},function(error){});
			},function(error){});
		},
		showloading:function(){
			if (!$('div#loading').size()) $('body').append($('<div id="loading">'));
			$('div#loading').show();
		},
		hideloading:function(){
			$('div#loading').hide();
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		/* load fieldinfos */
		functions.loadfieldinfos();
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
