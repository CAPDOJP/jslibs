/*
*--------------------------------------------------------------------
* jQuery-Plugin "relations"
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
		config:{},
		fieldinfos:{},
		params:{}
	};
	var events={
		show:[
			'app.record.create.show',
			'app.record.edit.show',
			'mobile.app.record.create.show',
			'mobile.app.record.edit.show'
		]
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* get fieldinfo */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fieldinfos=$.fieldparallelize(resp.properties);
			/* get configuration */
			$.each(JSON.parse(vars.config['relations']),function(index,values){
				vars.params[values['basefield']]={
					baseapp:values['baseapp'],
					baseappfield:values['baseappfield'],
					basetype:values['basetype'],
					istable:(values['istable']=='1')?true:false,
					relations:[]
				};
				var relations=[];
				$.each(values['relations'],function(index,values){
					relations.push({
						relationfield:values['relationfield'],
						relationapp:values['relationapp'],
						relationappfield:values['relationappfield'],
						relationtype:values['relationtype'],
						basecode:values['basecode'],
						relationcode:values['relationcode'],
						lookup:(values['lookup']=='1')?true:false,
						rewrite:(values['rewrite']=='1')?false:true
					});
				});
				vars.params[values['basefield']].relations=relations;
			});
			$.each(vars.params,function(key,values){
				setInterval(function(){
					$.each($('body').fields(key),function(){
						var base={
							container:$('body'),
							target:$(this),
							value:null
						};
						base.value=(base.target.val())?base.target.val():'';
						if ($.data(base.target[0],'value')==null) $.data(base.target[0],'value','');
						if ($.data(base.target[0],'value')==base.value) return;
						$.data(base.target[0],'value',base.value);
						if (base.value.length!=0)
						{
							if (values.istable) base.container=base.target.closest('tr');
							var body={
								app:values.baseapp,
								query:''
							};
							switch (values.basetype)
							{
								case 'NUMBER':
								case 'RECORD_NUMBER':
									body.query=values.baseappfield+'='+base.value;
									break;
								case 'SINGLE_LINE_TEXT':
									body.query=values.baseappfield+'="'+base.value+'"';
									break;
							}
							kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
								if (resp.records.length==0) return;
								for (var i=0;i<values.relations.length;i++)
								{
									var exclude=false;
									var relation=values.relations[i];
									var field=base.container.fields(relation.relationfield)[0];
									if (!relation.rewrite)
									{
										if (field.val())
											if (field.val().toString().length!=0) exclude=true;
									}
									if (!exclude)
									{
										(function(record,relation,field){
											var body={
												app:relation.relationapp,
												query:''
											};
											switch (relation.relationtype)
											{
												case 'NUMBER':
												case 'RECORD_NUMBER':
													body.query=relation.relationcode+'='+record[relation.basecode].value;
													break;
												case 'SINGLE_LINE_TEXT':
													body.query=relation.relationcode+'="'+record[relation.basecode].value+'"';
													break;
											}
											kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
												if (resp.records.length==0) return;
												field.val(resp.records[0][relation.relationappfield].value);
												if (relation.lookup) field.parent().parent().find('button').eq(0).trigger('click');
											},function(error){
												swal('Error!',error.message,'error');
											});
										})(resp.records[0],relation,field);
									}
								}
							},function(error){
								swal('Error!',error.message,'error');
							});
						}
					});
				},250);
			});
		},function(error){});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
