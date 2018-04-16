/*
*--------------------------------------------------------------------
* jQuery-Plugin "recordtransfer"
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
		config:{}
	};
	var events={
		show:[
			'app.record.detail.show'
		]
	};
	var functions={
		setupfilevalue:function(counter,files,callback){
			if (counter<files.length)
			{
				functions.download(files[counter].fileinfo.fileKey).then(function(blob){
					functions.upload(files[counter].fileinfo.name,files[counter].fileinfo.contentType,blob).then(function(resp){
						files[counter].field.value.push({fileKey:JSON.parse(resp).fileKey})
						counter++;
						functions.setupfilevalue(counter,files,callback);
					});
				});
			}
			else callback();
		},
		setupvalue:function(from,to,files){
			switch (from.type)
			{
				case 'FILE':
					to.value=[];
					for (var i=0;i<from.value.length;i++)
						files.push({
							field:to,
							fileinfo:from.value[i]
						})
					break;
				default:
					to.value=from.value;
					break;
			}
		}
	}
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		if ($('.custom-elements-recordtransfer').size()) $('.custom-elements-recordtransfer').remove();
		if ($('.gaia-app-statusbar').size()) $('.gaia-app-statusbar').css({'display':'inline-block'});
		$('.gaia-argoui-app-toolbar-statusmenu').append(
			$('<button type="button" class="recordtransfer-button custom-elements-recordtransfer">').text('受講振替')
			.on('click',function(e){
				var record=kintone.app.record.get().record;
				if (record[vars.config['startmonth']].value)
				{
					var body={
						app:vars.config['lecture'],
						record:{}
					};
					$.each(record,function(key,values){
						switch (values.type)
						{
							case 'CALC':
							case 'CATEGORY':
							case 'CREATED_TIME':
							case 'CREATOR':
							case 'MODIFIER':
							case 'RECORD_NUMBER':
							case 'STATUS':
							case 'STATUS_ASSIGNEE':
							case 'UPDATED_TIME':
								break;
							default:
								body.record[key]=values;
								break;
						}
					});
					kintone.api(kintone.api.url('/k/v1/record',true),'POST',body,function(resp){
						var id=resp.id;
						body={
							app:kintone.app.getId(),
							ids:[record['$id'].value]
						};
						kintone.api(kintone.api.url('/k/v1/records',true),'DELETE',body,function(resp){
							window.location.href='https://'+$(location).attr('host')+'/k/'+vars.config['lecture']+'/show#record='+id+'&mode=show';
						},function(error){
							swal('Error!',error.message,'error');
						});
					},function(error){
						swal('Error!',error.message,'error');
					});
				}
				else swal('Error!','受講開始月を入力して下さい。','error');
			})
		);
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
