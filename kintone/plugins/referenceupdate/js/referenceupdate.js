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
		progress:null,
		config:{}
	};
	var events={
		save:[
			'app.record.create.submit',
			'app.record.edit.submit',
			'mobile.app.record.create.submit',
			'mobile.app.record.edit.submit',
			'app.record.index.edit.submit'
		]
	};
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
				var apps=JSON.parse(vars.config['apps']);
				var counter=0;
				var bodies=[];
				var loadapps=function(callback){
					var body={
						app:apps[counter].app,
						query:''
					};
					for (var i=0;i<apps[counter].setting.keys.length;i++)
					{
						var keys=apps[counter].setting.keys[i];
						if (!event.record[keys.from].value)
						{
							event.error=resp.properties[keys.from].label+'を入力して下さい。';
							callback();
						}
						if (event.record[keys.from].value.length==0)
						{
							event.error=resp.properties[keys.from].label+'を入力して下さい。';
							callback();
						}
						body.query+=keys.to+$.fieldquery(event.record[keys.from]);
						if (i<apps[counter].setting.keys.length-1) body.query+=' and ';
					}
					kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
						for (var i=0;i<resp.records.length;i++)
						{
							bodies.push({
								app:apps[counter].app,
								id:resp.records[i]['$id'].value,
								record:(function(){
									var res={};
									for (var i2=0;i2<apps[counter].setting.values.length;i2++)
									{
										var values=apps[counter].setting.values[i2];
										res[values.to]={value:event.record[values.from].value};
									}
									return res;
								})()
							});
						}
						counter++;
						if (counter<apps.length)
						{
							vars.progress.find('.progressbar').find('.progresscell').width(vars.progress.find('.progressbar').innerWidth()*(counter/apps.length));
							loadapps(callback);
						}
						else callback();
					},
					function(error){
						event.error=error.message;
						callback();
					});
				};
				if (apps.length==0) resolve(event);
				vars.progress.find('.message').text('更新データ取得中');
				vars.progress.find('.progressbar').find('.progresscell').width(0);
				vars.progress.show();
				loadapps(function(){
					if (!event.error)
					{
						vars.progress.find('.message').text('データ更新中');
						vars.progress.find('.progressbar').find('.progresscell').width(0);
						counter=0;
						for (var i=0;i<bodies.length;i++)
							(function(body,success,fail){
								kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
									counter++;
									if (counter<bodies.length) vars.progress.find('.progressbar').find('.progresscell').width(vars.progress.find('.progressbar').innerWidth()*(counter/bodies.length));
									else success();
								},function(error){
									event.error=error.message;
									fail();
								});
							})(bodies[i],function(){
								resolve(event);
							},function(){
								resolve(event);
							});
					}
					else
					{
						vars.progress.hide();
						resolve(event);
					}
				});
			},function(error){});
		});
	});
})(jQuery,kintone.$PLUGIN_ID);
