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
			var update=false;
			var record=null;
			var body={};
			var filters=[];
			var summaries=[];
			var summarykeys=[];
			var summaryfields=[];
			var copyfields=JSON.parse(vars.config.copyfields);
			var sumfields=JSON.parse(vars.config.sumfields);
			/* summary */
			$.each(copyfields,function(key,values){
				if (values.length!=0)
				{
					if (sumfields[key]=='0') summarykeys.push(key);
					if (sumfields[key]=='1') summaryfields.push(key);
				}
			});
			$.each(vars.records,function(index,values){
				var added=false;
				record=values;
				if (summaryfields.length!=0)
				{
					var summaryfilter=$.grep(summaries,function(item,index){
						var ismatch=true;
						$.each(summarykeys,function(index){if (item[summarykeys[index]].value!=record[summarykeys[index]].value) ismatch=false;});
						return ismatch;
					});
					if (summaryfilter.length!=0)
					{
						$.each(summaryfields,function(index){
							var code=summaryfields[index];
							var value=0;
							value+=(summaryfilter[0][code].value!=null)?parseFloat(summaryfilter[0][code].value):0;
							value+=(record[code].value!=null)?parseFloat(record[code].value):0;
							summaryfilter[0][code].value=value;
						});
						added=true;
					}
				}
				if (!added)
				{
					summaries.push({});
					$.each(copyfields,function(key,values){
						if (values.length!=0) summaries[summaries.length-1][key]={value:record[key].value};
					});
				}
			});
			if (summaries.length==0)
			{
				swal('Error!','データがありません。','error');
				return;
			}
			vars.progress.find('.message').text('コピーしています');
			vars.progress.find('.progressbar').find('.progresscell').width(0);
			vars.progress.show();
			if (vars.config.keyfrom.length!=0)
			{
				/* update */
				functions.loaddatas(vars.config.copyapp,function(){
					$.each(summaries,function(index){
						if (error) return false;
						record=summaries[index];
						filters.push({counter:0,filter:[]});
						filters[index].filter=$.grep(vars.apps,function(item,index){return item[vars.config.keyto].value==record[vars.config.keyfrom].value;});
						for (var i=0;i<filters[index].filter.length;i++)
						{
							if (error) return false;
							body={
								app:vars.config.copyapp,
								id:filters[index].filter[i]['$id'].value,
								record:{}
							};
							$.each(copyfields,function(key,values){
								if (values.length!=0) body.record[values]={value:record[key].value};
							});
							kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
								filters[index].counter++;
								if (filters[index].counter==filters[index].filter.length)
								{
									counter++;
									if (counter<summaries.length) vars.progress.find('.progressbar').find('.progresscell').width(vars.progress.find('.progressbar').innerWidth()*(counter/summaries.length));
									else
									{
										vars.progress.hide();
										swal('登録完了','データを登録しました。','success');
									}
								}
							},function(error){
								vars.progress.hide();
								swal('Error!',error.message,'error');
								error=true;
							});
							update=true;
						}
					});
					if (!error && !update)
					{
						vars.progress.hide();
						swal('Error!','条件に該当するレコードが見つかりませんでした。','error');
					}
				});
			}
			else
			{
				/* register */
				body={
					app:vars.config.copyapp,
					records:[]
				};
				$.each(summaries,function(index){
					body.records.push({});
					record=summaries[index];
					$.each(copyfields,function(key,values){
						if (values.length!=0) body.records[index][values]={value:record[key].value};
					});
				});
				kintone.api(kintone.api.url('/k/v1/records',true),'POST',body,function(resp){
					vars.progress.hide();
					swal('登録完了','データを登録しました。','success');
				},function(error){
					vars.progress.hide();
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
