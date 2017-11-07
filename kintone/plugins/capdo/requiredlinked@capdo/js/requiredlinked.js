/*
*--------------------------------------------------------------------
* jQuery-Plugin "requiredlinked"
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
		relations:[],
		config:{}
	};
	var events={
		save:[
			'app.record.create.submit',
			'app.record.edit.submit',
			'mobile.app.record.create.submit',
			'mobile.app.record.edit.submit'
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
					if (!vars.config) return event;
					if (!('relation' in vars.config))  return event;
					var error='';
					vars.relations=JSON.parse(vars.config['relation']);
					$.each(vars.relations,function(index){
						error='';
						if (!event.record[vars.relations[index].trigger].value) return true;
						if (event.record[vars.relations[index].trigger].value.length==0) return true;
						if (error.length==0 && !event.record[vars.relations[index].require].value) error='必須項目です。';
						if (error.length==0 && event.record[vars.relations[index].require].value.length==0) error='必須項目です。';
						if (error.length!=0)
						{
							event.record[vars.relations[index].require].error=error;
							event.error='未入力項目があります。';
						}
					});
					return event;
				});
			}
			else swal('Error!','ライセンス認証に失敗しました。','error');
		},
		function(error){swal('Error!','ライセンス認証に失敗しました。','error');}
	);
})(jQuery,kintone.$PLUGIN_ID);
