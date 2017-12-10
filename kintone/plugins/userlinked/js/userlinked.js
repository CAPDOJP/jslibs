/*
*--------------------------------------------------------------------
* jQuery-Plugin "userlinked"
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
		login:null,
		setting:{},
		config:{}
	};
	var events={
		lists:[
			'app.record.index.show'
		],
		save:[
			'app.record.create.submit',
			'app.record.edit.submit',
			'mobile.app.record.create.submit',
			'mobile.app.record.edit.submit',
			'app.record.index.edit.submit'
		],
		show:[
			'app.record.create.show',
			'app.record.edit.show',
			'mobile.app.record.create.show',
			'mobile.app.record.edit.show'
		]
	};
	var functions={
		/* login check */
		checklogin:function(callback){
			if (!kintone.getLoginUser()) return;
			var settings=JSON.parse(vars.config.setting);
			switch (vars.config.segment)
			{
				case '1':
					kintone.api(kintone.api.url('/v1/users',true),'GET',{codes:[kintone.getLoginUser().code]},function(resp){
						if (resp.users)
						{
							vars.login=resp.users[0];
							if (vars.login.code in settings) callback(settings[vars.login.code]);
						}
					},function(error){});
					break;
				case '2':
					kintone.api(kintone.api.url('/v1/user/organizations',true),'GET',{code:kintone.getLoginUser().code},function(resp){
						if (resp.organizationTitles)
						{
							vars.login=resp.organizationTitles[0].organization;
							if (vars.login.code in settings) callback(settings[vars.login.code]);
						}
					},function(error){});
					break;
				case '3':
					kintone.api(kintone.api.url('/v1/user/groups',true),'GET',{code:kintone.getLoginUser().code},function(resp){
						if (resp.groups)
						{
							vars.login=resp.groups[0];
							if (vars.login.code in settings) callback(settings[vars.login.code]);
						}
					},function(error){});
					break;
			}
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		/* check login */
		functions.checklogin(function(resp){
			vars.setting=resp;
			/* check viewid */
			if (vars.setting.view.length!=0 && vars.setting.view!=event.viewId && $.queries.length==0)
				window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/?view='+vars.setting.view;
		});
		return event;
	});
	kintone.events.on(events.save,function(event){
		if (Object.keys(vars.setting).length!=0)
		{
			var error='';
			for (var i=0;i<vars.setting.requires.length;i++)
			{
				var field=vars.setting.requires[i];
				if (field in event.record)
				{
					if (error.length==0 && !event.record[field].value) error='必須項目です。';
					if (error.length==0 && event.record[field].value.length==0) error='必須項目です。';
					if (error.length!=0) event.record[field].error=error;
				}
			}
			if (error.length!=0) event.error='未入力項目があります。';
			return event;
		}
		else return event;
	});
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		/* check login */
		functions.checklogin(function(resp){
			vars.setting=resp;
			if (event.type.match(/create/g)!=null)
			{
				var record=(event.type.match(/mobile/g)!=null)?kintone.mobile.app.record.get():kintone.app.record.get();
				for (var i=0;i<vars.setting.autos.length;i++)
				{
					var field=vars.setting.autos[i];
					if (field.field in record.record)
						switch (record.record[field.field].type)
						{
							case 'GROUP_SELECT':
							case 'ORGANIZATION_SELECT':
							case 'USER_SELECT':
								record.record[field.field].value.push({
									code:vars.login.code,
									name:vars.login.name
								});
								break;
							case 'SINGLE_LINE_TEXT':
								record.record[field.field].value=vars.login.name;
								break;
							default:
								record.record[field.field].value=field.value;
								break;
						}
				}
				if (event.type.match(/mobile/g)!=null) kintone.mobile.app.record.set(record);
				else kintone.app.record.set(record);
			}
		});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
