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
		apps:{},
		offset:{},
		copybutton:null,
		progress:null,
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
			var querykeys={};
			var summaries=[];
			var summarykeys=[];
			var summaryfields=[];
			var copyfields=JSON.parse(vars.config.copyfields);
			var keyfields=JSON.parse(vars.config.keyfields);
			var sumfields=JSON.parse(vars.config.sumfields);
			kintone.api(kintone.api.url('/k/v1/app/views',true),'GET',{app:vars.config.copyapp},function(resp){
				var error=true;
				$.each(resp.views,function(key,values){
					if (values.id==vars.config.copyview)
					{
						/* load copy data */
						vars.offset[vars.config.copyapp]=0;
						functions.loaddatas(vars.config.copyapp,values.filterCond,values.sort,function(){
							/* summary */
							$.each(copyfields,function(key,values){
								if (values.length!=0)
								{
									if (sumfields[key]=='0') summarykeys.push(values);
									if (sumfields[key]=='1') summaryfields.push(values);
								}
							});
							$.each(vars.apps[vars.config.copyapp],function(index,values){
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
										if (values.length!=0) summaries[summaries.length-1][values]={value:record[values].value};
									});
								}
							});
							if (summaries.length==0)
							{
								swal('Error!','データがありません。','error');
								return;
							}
							/* query */
							$.each(keyfields,function(key,values){if (values.length!=0) querykeys[key]=values;});
							vars.progress.find('.message').text('コピーしています');
							vars.progress.find('.progressbar').find('.progresscell').width(0);
							vars.progress.show();
							if (Object.keys(querykeys).length!=0)
							{
								/* update */
								vars.offset[kintone.app.getId()]=0;
								functions.loaddatas(kintone.app.getId(),'','',function(){
									$.each(summaries,function(index){
										if (error) return false;
										record=summaries[index];
										filters.push({counter:0,filter:[]});
										filters[index].filter=$.grep(vars.apps[kintone.app.getId()],function(item,index){
											var ismatch=true;
											$.each(querykeys,function(key,values){if (item[key].value!=record[values].value) ismatch=false;});
											return ismatch;
										});
										if (filters[index].filter.length!=0)
										{
											for (var i=0;i<filters[index].filter.length;i++)
											{
												if (error) return false;
												body={
													app:kintone.app.getId(),
													id:filters[index].filter[i]['$id'].value,
													record:{}
												};
												$.each(copyfields,function(key,values){
													if (values.length!=0) body.record[key]={value:record[values].value};
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
															swal({
																title:'登録完了',
																text:'データを登録しました。',
																type:'success'
															},function(){location.reload(true);});
														}
													}
												},function(error){
													vars.progress.hide();
													swal('Error!',error.message,'error');
													error=true;
												});
												update=true;
											}
										}
										else counter++;
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
									app:kintone.app.getId(),
									records:[]
								};
								$.each(summaries,function(index){
									body.records.push({});
									record=summaries[index];
									$.each(copyfields,function(key,values){
										if (values.length!=0) body.records[index][key]={value:record[values].value};
									});
								});
								kintone.api(kintone.api.url('/k/v1/records',true),'POST',body,function(resp){
									vars.progress.hide();
									swal({
										title:'登録完了',
										text:'データを登録しました。',
										type:'success'
									},function(){location.reload(true);});
								},function(error){
									vars.progress.hide();
									swal('Error!',error.message,'error');
								});
							}
						});
						error=false;
					}
				});
				if (error)
				{
					swal('Error!','コピー元一覧が存在しません。','error');
					return;
				}
			});
		},
		loaddatas:function(appkey,filter,sort,callback){
			var query=''
			if (filter.length!=0) query+=filter+' ';
			if (sort.length!=0) query+='order by '+sort+' ';
			query+='limit '+vars.limit.toString()+' offset '+vars.offset[appkey].toString();
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',{app:appkey,query:query},function(resp){
				if (vars.apps[appkey]==null) vars.apps[appkey]=resp.records;
				else Array.prototype.push.apply(vars.apps[appkey],resp.records);
				vars.offset[appkey]+=vars.limit;
				if (resp.records.length==vars.limit) functions.loaddatas(appkey,filter,sort,callback);
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
		/* initialize valiable */
		if (vars.progress==null)
		{
			vars.progress=$('<div id="progress">').append($('<div class="message">')).append($('<div class="progressbar">').append($('<div class="progresscell">')));
			$('body').append(vars.progress);
		}
		/* create button */
		vars.copybutton=$('<button class="kintoneplugin-button-dialog-ok">')
		.text(vars.config.buttonlabel)
		.on('click',function(e){functions.copy();});
		/* append elements */
		kintone.app.getHeaderMenuSpaceElement().innerHTML='';
		kintone.app.getHeaderMenuSpaceElement().appendChild(vars.copybutton[0]);
	});
})(jQuery,kintone.$PLUGIN_ID);
