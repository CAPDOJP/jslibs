/*
*--------------------------------------------------------------------
* jQuery-Plugin "itemlinked"
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
		fields:[],
		items:[],
		config:{}
	};
	var events={
		save:[
			'app.record.create.submit',
			'app.record.edit.submit',
			'app.record.index.edit.submit'
		]
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
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
				kintone.events.on(events.save,function(event){
					vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
					if (!vars.config) return event;
					if (!('trigger' in vars.config))  return event;
					if (!('item' in vars.config))  return event;
					var error='';
					vars.items=JSON.parse(vars.config['item']);
					if (vars.config['trigger'] in event.record)
						if (event.record[vars.config['trigger']].value in vars.items)
						{
							vars.fields=vars.items[event.record[vars.config['trigger']].value].split(',');
							for (var i=0;i<vars.fields.length;i++)
							{
								if (error.length==0 && !event.record[vars.fields[i]].value) error='必須項目です。';
								if (error.length!=0) event.record[vars.fields[i]].error=error;
							}
							if (error.length!=0) event.error='未入力項目があります。';
						}
					return event;
				});
			}
			else swal('Error!','ライセンス認証に失敗しました。','error');
		},
		function(error){swal('Error!','ライセンス認証に失敗しました。','error');}
	);
})(jQuery,kintone.$PLUGIN_ID);
