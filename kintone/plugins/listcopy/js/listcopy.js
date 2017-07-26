/*
*--------------------------------------------------------------------
* jQuery-Plugin "listcopy"
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
		limit:500,
		offset:0,
		apps:null,
		container:null,
		copybutton:null,
		progress:null,
		records:null,
		config:{}
	};
	var events={
		show:[
			'app.record.index.show'
		]
	};
	var functions={
		/* copy */
		copy:function(){
			var counter=0;
			var error=false;
			var fields=null;
			var body={};
			var copyfields=JSON.parse(vars.config.copyfields);
			if (vars.records.length==0)
			{
				swal('Error!','データがありません。','error');
				return;
			}
			if (vars.config.keyfrom.length!=0)
			{
				vars.progress.find('.message').text('コピーしています');
				vars.progress.find('.progressbar').find('.progresscell').width(0);
				vars.progress.show();
				functions.loaddatas(vars.config.copyapp,function(){
					$.each(vars.records,function(index,values){
						if (error) return false;
						var filter=$.grep(vars.apps,function(item,index){return item[vars.config.keyto].value==values[vars.config.keyfrom].value;});
						fields=values;
						$.each(filter,function(index){
							if (error) return false;
							body={
								app:vars.config.copyapp,
								id:filter[index]['$id'].value,
								record:{}
							};
							$.each(copyfields,function(key,values){
								if (values.length!=0) body.record[values]={value:fields[key].value};
							});
							kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
								counter++;
								if (counter<vars.records.length) vars.progress.find('.progressbar').find('.progresscell').width(vars.progress.find('.progressbar').innerWidth()*(counter/vars.records.length));
								else
								{
									vars.progress.hide();
									swal('登録完了','データを登録しました。','success');
								}
							},function(error){
								vars.progress.hide();
						    	swal('Error!',error.message,'error');
						    	error=true;
							});
						});
					});
					if (counter) swal('Error!','条件に該当するレコードが見つかりませんでした。','error');
				});
			}
			else
			{
				/* register */
				body={
					app:vars.config.copyapp,
					records:[]
				};
				$.each(vars.records,function(index,values){
					body.records.push({});
					fields=values;
					$.each(copyfields,function(key,values){
						if (values.length!=0) body.records[index][values]={value:fields[key].value};
					});
				});
				kintone.api(kintone.api.url('/k/v1/records',true),'POST',body,function(resp){
					swal('登録完了','データを登録しました。','success');
				},function(error){
					swal('Error!',error.message,'error');
				});
			}
		},
		loaddatas:function(appkey,callback){
	        kintone.api(kintone.api.url('/k/v1/records',true),'GET',{app:appkey,query:'limit '+vars.limit.toString()+' offset '+vars.offset.toString()},function(resp){
	        	if (vars.apps==null) vars.apps=resp.records;
	        	else Array.prototype.push.apply(vars.apps,resp.records);
				vars.offset+=vars.limit;
				if (resp.records.length==vars.limit) functions.loaddatas(appkey,callback);
				else
				{
					if (callback!=null) callback();
				}
			},function(error){});
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* check copyview */
		if (event.viewId.toString()!=vars.config.copyview) return event;
		/* initialize valiable */
		vars.progress=$('<div id="progress">')
		.append($('<div class="message">'))
		.append($('<div class="progressbar">').append($('<div class="progresscell">')));
		vars.records=event.records;
		/* create button */
		vars.copybutton=$('<button class="kintoneplugin-button-dialog-ok">')
		.text('コピー開始')
		.on('click',function(e){functions.copy();});
		/* append elements */
		kintone.app.getHeaderMenuSpaceElement().innerHTML='';
		kintone.app.getHeaderMenuSpaceElement().appendChild(vars.copybutton[0]);
		$('body').append(vars.progress);
	});
})(jQuery,kintone.$PLUGIN_ID);
