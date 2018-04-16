/*
*--------------------------------------------------------------------
* jQuery-Plugin "addresscopy"
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
		isediting:false,
		events:[],
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
				vars.event=[];
				vars.events.push('app.record.create.change.'+vars.config['addressfrom']);
				vars.events.push('app.record.edit.change.'+vars.config['addressfrom']);
				vars.events.push('app.record.index.edit.change.'+vars.config['addressfrom']);
				vars.events.push('app.record.create.change.'+vars.config['buildingfrom']);
				vars.events.push('app.record.edit.change.'+vars.config['buildingfrom']);
				vars.events.push('app.record.index.edit.change.'+vars.config['buildingfrom']);
				vars.events.push('app.record.create.change.'+vars.config['zipcodefrom']);
				vars.events.push('app.record.edit.change.'+vars.config['zipcodefrom']);
				vars.events.push('app.record.index.edit.change.'+vars.config['zipcodefrom']);
				vars.events.push('app.record.create.change.'+vars.config['zipcodeto']);
				vars.events.push('app.record.edit.change.'+vars.config['zipcodeto']);
				vars.events.push('app.record.index.edit.change.'+vars.config['zipcodeto']);
				kintone.events.on(vars.events,function(event){
					if (vars.isediting) {vars.isediting=false;return event;}
					var type=event.type.split('.');
					switch (type[type.length-1])
					{
						case vars.config['addressfrom']:
						case vars.config['buildingfrom']:
							if (event.record[vars.config['conditionfield']].value==vars.config['conditionvalue'])
							{
								vars.isediting=(event.record[vars.config['zipcodefrom']].value!=event.record[vars.config['zipcodeto']].value);
								event.record[vars.config['zipcodeto']].value=event.record[vars.config['zipcodefrom']].value;
								event.record[vars.config['addressto']].value=event.record[vars.config['addressfrom']].value;
								event.record[vars.config['buildingto']].value=event.record[vars.config['buildingfrom']].value;
							}
							break;
						case vars.config['zipcodefrom']:
						case vars.config['zipcodeto']:
							if (event.changes.field.value)
								kintone.proxy(
									'http://api.zipaddress.net/?zipcode='+event.changes.field.value,
									'GET',
									{},
									{},
									function(body){
										var response=JSON.parse(body);
										if (response.code==200)
										{
											var record=kintone.app.record.get();
											switch (type[type.length-1])
											{
												case vars.config['zipcodefrom']:
													record.record[vars.config['addressfrom']].value=response.data.fullAddress;
													if (event.record[vars.config['conditionfield']].value==vars.config['conditionvalue'])
													{
														record.record[vars.config['zipcodeto']].value=event.changes.field.value;
														record.record[vars.config['addressto']].value=response.data.fullAddress;
													}
													break;
												case vars.config['zipcodeto']:
													record.record[vars.config['addressto']].value=response.data.fullAddress;
													break;
											}
											kintone.app.record.set(record);
										}
										else
										{
											if (response.message) swal('Error!',response.message,'error');
											else swal('Error!','郵便番号から住所の検索に失敗しました。','error');
										}
									},
									function(error){swal('Error!','郵便番号から住所の検索に失敗しました。','error');}
								);
							break;
					}
					return event;
				});
				kintone.events.on(events.save,function(event){
					if (event.record[vars.config['conditionfield']].value==vars.config['conditionvalue'])
					{
						event.record[vars.config['zipcodeto']].value=event.record[vars.config['zipcodefrom']].value;
						event.record[vars.config['addressto']].value=event.record[vars.config['addressfrom']].value;
						event.record[vars.config['buildingto']].value=event.record[vars.config['buildingfrom']].value;
					}
					return event;
				});
			}
			else swal('Error!','ライセンス認証に失敗しました。','error');
		},
		function(error){swal('Error!','ライセンス認証に失敗しました。','error');}
	);
})(jQuery,kintone.$PLUGIN_ID);
