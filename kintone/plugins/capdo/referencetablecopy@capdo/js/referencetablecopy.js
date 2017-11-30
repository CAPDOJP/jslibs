/*
*--------------------------------------------------------------------
* jQuery-Plugin "referencetablecopy"
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
		license:false,
		limit:500,
		config:{},
		fieldinfos:{}
	};
	var events={
		show:[
			'app.record.create.show',
			'app.record.edit.show',
			'mobile.app.record.create.show',
			'mobile.app.record.edit.show'
		],
		save:[
			'app.record.create.submit',
			'app.record.edit.submit',
			'mobile.app.record.create.submit',
			'mobile.app.record.edit.submit'
		]
	};
	var functions={
		loadapps:function(counter,param,callback){
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:param[counter].app},function(resp){
				var body={
					app:param[counter].app,
					query:param[counter].query
				};
				body.query+=' order by '+param[counter].sort+' limit '+param[counter].limit.toString()+' offset '+param[counter].offset.toString();
				kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
					Array.prototype.push.apply(param[counter].records,resp.records);
					param[counter].offset+=param[counter].limit;
					if (resp.records.length==param[counter].limit) functions.loadapps(counter,param,callback);
					else
					{
						counter++;
						if (counter<param.length) functions.loadapps(counter,param,callback);
						else callback();
					}
				},function(error){
					swal('Error!',error.message,'error');
				});
			},
			function(error){
				swal('Error!',error.message,'error');
			});
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
			vars.fieldinfos=resp.properties;
			kintone.proxy(
				vars.config['license']+'?domain='+$(location).attr('host').replace(/\.cybozu\.com/g,''),
				'GET',
				{},
				{},
				function(body,status,headers){
					if (status>=200 && status<300)
					{
						var json=JSON.parse(body);
						if (parseInt('0'+json.permit)==0) {swal('Error!','ライセンスが登録されていません。','error');return;}
						vars.license=true;
					}
					else swal('Error!','ライセンス認証に失敗しました。','error');
				},
				function(error){swal('Error!','ライセンス認証に失敗しました。','error');}
			);
		},function(error){});
	});
	kintone.events.on(events.save,function(event){
		if (!vars.license) return event;
		return new kintone.Promise(function(resolve,reject){
			var counter=0;
			var param=[];
			var relations=JSON.parse(vars.config['relation']);
			$.each(relations,function(index){
				var fieldinfo=vars.fieldinfos[relations[index].copyfrom];
				var added=false;
				param.push({
					app:fieldinfo.referenceTable.relatedApp.app,
					query:'',
					sort:fieldinfo.referenceTable.sort,
					limit:vars.limit,
					offset:0,
					records:[],
					table:relations[index].copyto,
					fields:relations[index].fields
				});
				if (fieldinfo.referenceTable.condition.field.length!=0)
				{
					var isnumber=false;
					var field=vars.fieldinfos[fieldinfo.referenceTable.condition.field];
					switch (field.type)
					{
						case 'CALC':
							switch (field.format)
							{
								case 'NUMBER':
								case 'NUMBER_DIGIT':
									isnumber=true;
									break;
							}
							break;
						case 'NUMBER':
						case 'RECORD_NUMBER':
							isnumber=true;
							break;
					}
					if (isnumber) param[param.length-1].query+=fieldinfo.referenceTable.condition.relatedField+'='+event.record[fieldinfo.referenceTable.condition.field].value;
					else param[param.length-1].query+=fieldinfo.referenceTable.condition.relatedField+'="'+event.record[fieldinfo.referenceTable.condition.field].value+'"';
					added=true;
				}
				if (fieldinfo.referenceTable['filterCond'].length!=0)
				{
					if (added) param[param.length-1].query+=' and ';
					param[param.length-1].query+=fieldinfo.referenceTable['filterCond'];
				}
			});
			functions.loadapps(counter,param,function(){
				for (var i=0;i<param.length;i++)
				{
					var fields=vars.fieldinfos[param[i].table].fields;
					event.record[param[i].table].value=[];
					for (var i2=0;i2<param[i].records.length;i2++)
					{
						var record={value:{}};
						$.each(param[i].fields,function(key,values){
							record.value[key]={
								type:fields[key].type,
								value:param[i].records[i2][values].value
							};
						});
						event.record[param[i].table].value.push(record);
					}
				}
				resolve(event);
			});
		});
	});
})(jQuery,kintone.$PLUGIN_ID);