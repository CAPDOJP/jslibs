/*
*--------------------------------------------------------------------
* jQuery-Plugin "referenceupdate"
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
		counter:0,
		progress:null,
		apps:[],
		bodies:[],
		config:{},
		fieldinfos:{}
	};
	var events={
		save:[
			'app.record.create.submit.success',
			'app.record.edit.submit.success',
			'app.record.index.edit.submit.success'
		]
	};
	var functions={
		loadapps:function(event,callback){
			var body={
				app:vars.apps[vars.counter].app,
				query:''
			};
			var setting=vars.apps[vars.counter].setting;
			var tablecode=setting.keys[0].tablecode;
			for (var i=0;i<setting.keys.length;i++)
			{
				var keys=setting.keys[i];
				if (!event.record[keys.from].value)
				{
					event.error=vars.fieldinfos[keys.from].label+'を入力して下さい。';
					callback();
				}
			}
			if (tablecode.length==0)
			{
				for (var i=0;i<setting.keys.length;i++)
				{
					var keys=setting.keys[i];
					body.query+=keys.to+$.fieldquery(event.record[keys.from]);
					if (i<setting.keys.length-1) body.query+=' and ';
				}
			}
			body.query+=' order by $id asc limit '+vars.apps[vars.counter].limit.toString()+' offset '+vars.apps[vars.counter].offset.toString();
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				if (tablecode.length==0)
				{
					for (var i=0;i<resp.records.length;i++)
					{
						vars.bodies.push({
							app:vars.apps[vars.counter].app,
							id:resp.records[i]['$id'].value,
							record:(function(){
								var res={};
								for (var i2=0;i2<setting.values.length;i2++)
								{
									var values=setting.values[i2];
									res[values.to]={value:event.record[values.from].value};
								}
								return res;
							})()
						});
					}
				}
				else
				{
					for (var i=0;i<resp.records.length;i++)
					{
						var filter=$.grep(resp.records[i][tablecode].value,function(item,index){
							var exists=0;
							for (var i2=0;i2<setting.keys.length;i2++)
							{
								var keys=setting.keys[i2];
								if ($.fieldvalue(item.value[keys.to])==$.fieldvalue(event.record[keys.from])) exists++;
							}
							return exists==setting.keys.length;
						});
						if (filter.length!=0)
						{
							for (var i2=0;i2<filter.length;i2++)
								for (var i3=0;i3<setting.values.length;i3++)
								{
									var values=setting.values[i3];
									filter[i2].value[values.to].value=event.record[values.from].value;
								}
							vars.bodies.push({
								app:vars.apps[vars.counter].app,
								id:resp.records[i]['$id'].value,
								record:(function(rows){
									var res={};
									res[tablecode]={value:rows};
									return res;
								})(resp.records[i][tablecode].value)
							});
						}
					}
				}
				vars.apps[vars.counter].offset+=vars.apps[vars.counter].limit;
				if (resp.records.length==vars.apps[vars.counter].limit) functions.loadapps(event,callback);
				else
				{
					vars.counter++;
					if (vars.counter<vars.apps.length)
					{
						vars.progress.find('.progressbar').find('.progresscell').width(vars.progress.find('.progressbar').innerWidth()*(vars.counter/vars.apps.length));
						functions.loadapps(event,callback);
					}
					else callback();
				}
			},function(error){
				event.error=error.message;
				callback();
			});
		}
	}
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.save,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		vars.progress=$('<div id="progress">').append($('<div class="message">')).append($('<div class="progressbar">').append($('<div class="progresscell">')));
		$('body').append(vars.progress);
		return new kintone.Promise(function(resolve,reject){
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				vars.apps=JSON.parse(vars.config['apps']);
				vars.counter=0;
				vars.bodies=[];
				vars.fieldinfos=resp.properties;
				if (vars.apps.length==0) resolve(event);
				for (var i=0;i<vars.apps.length;i++)
				{
					vars.apps[i]['limit']=500;
					vars.apps[i]['offset']=0;
				}
				vars.progress.find('.message').text('更新データ取得中');
				vars.progress.find('.progressbar').find('.progresscell').width(0);
				vars.progress.show();
				functions.loadapps(event,function(){
					if (!event.error)
					{
						if (vars.bodies.length==0)
						{
							vars.progress.hide();
							resolve(event);
						}
						else
						{
							vars.progress.find('.message').text('データ更新中');
							vars.progress.find('.progressbar').find('.progresscell').width(0);
							vars.counter=0;
							for (var i=0;i<vars.bodies.length;i++)
								(function(body,success,fail){
									kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
										vars.counter++;
										if (vars.counter<vars.bodies.length) vars.progress.find('.progressbar').find('.progresscell').width(vars.progress.find('.progressbar').innerWidth()*(vars.counter/vars.bodies.length));
										else success();
									},function(error){
										event.error=error.message;
										fail();
									});
								})(vars.bodies[i],function(){
									vars.progress.hide();
									resolve(event);
								},function(){
									vars.progress.hide();
									if (event.error)
									{
										swal({
											title:'Error!',
											text:event.error,
											type:'error'
										},function(){resolve(event);});
									}
									else resolve(event);
								});
						}
					}
					else
					{
						vars.progress.hide();
						swal({
							title:'Error!',
							text:event.error,
							type:'error'
						},function(){resolve(event);});
					}
				});
			},function(error){});
		});
	});
})(jQuery,kintone.$PLUGIN_ID);
