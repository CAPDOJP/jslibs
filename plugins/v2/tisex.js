/*
* TIS-Plugin "tisex.js"
* Version: 1.0
* Copyright (c) 2018 TIS
* Released under the MIT License.
* http://tis2010.jp/license.txt
*/
"use strict";
class tislibraryextend{
	/* constructor */
	constructor(){}
	/* build row elements */
	buildrow(row,cells,display,url,target){
		if (cells)
		{
			for (var i=0;i<cells.length;i++)
				if (cells[i].text()) row.children[i].insertBefore(tis.create('span').addclass('caption').html(cells[i].text()),row.children[i].firstChild);
		}
		if (display)
		{
			var message='';
			var cell=row.elms('td').last();
			if (display=='0')
			{
				cell.elm('.icon').addclass('close');
				message='未使用に変更します';
			}
			else
			{
				cell.elm('.icon').addclass('retry');
				message='使用中に変更します';
			}
			cell.elm('.icon').on('click',(e) => {
				var record={id:row.elm('#id').val(),display:(display=='0')?'1':'0'};
				if (cell.elm('.icon').hasAttribute('disabled')) tis.alert('このレコードは変更することが出来ません');
				else
				{
					if (!record.id) tis.elm('#'+target).delrow(row);
					else
					{
						tis.confirm(message,() => {
							tis.request(url,'PUT',{'X-Requested-With':'XMLHttpRequest'},{target:target,type:'single',record:record})
							.then((resp) => tis.elm('#'+target).delrow(row))
							.catch((error) => tis.alert(error.message));
						});
					}
				}
			});
		}
	}
	/* bulk collect */
	bulkcollect(records,url,body,silent,callback){
		if (!('offset' in body)) body['offset']=0;
		if (!('limit' in body)) body['limit']=500;
		tis.request(url,'GET',{'X-Requested-With':'XMLHttpRequest'},body,silent)
		.then((resp) => {
			var res=JSON.parse(resp).records;
			Array.prototype.push.apply(records,res);
			body.offset+=body.limit;
			if (res.length==body.limit) this.bulkcollect(records,url,body,silent,callback);
			else
			{
				if (callback) callback(records);
			}
		})
		.catch((error) => tis.alert(error.message));
	}
	/* delete */
	delete(id,url,target,callback,confirm=true,alert=true){
		if (id)
		{
			var record={id:id,display:'1'};
			if (confirm)
			{
				tis.confirm('表示中のレコードを未使用に変更します',() => {
					tis.request(url,'PUT',{'X-Requested-With':'XMLHttpRequest'},{target:target,type:'single',record:record})
					.then((resp) => {
						if (alert) tis.alert('変更しました',() => {if (callback) callback()});
						else
						{
							if (callback) callback();
						}
					})
					.catch((error) => tis.alert(error.message));
				});
			}
			else
			{
				tis.request(url,'PUT',{'X-Requested-With':'XMLHttpRequest'},{target:target,type:'single',record:record})
				.then((resp) => {
					if (alert) tis.alert('変更しました',() => {if (callback) callback()});
					else
					{
						if (callback) callback();
					}
				})
				.catch((error) => tis.alert(error.message));
			}
		}
	}
	/* setting file elements */
	filesetting(add,del,file,value,url,dir,addcallback,delcallback){
		add.on('click',(e) => {
			file.click();
			e.stopPropagation();
			e.preventDefault();
		});
		del.on('click',(e) => {
			if (value.val())
				tis.confirm('削除します',() => {
					tis.file(url,'DELETE',{'X-Requested-With':'XMLHttpRequest'},{name:value.val(),dir:dir})
					.then((resp) => delcallback())
					.catch((error) => tis.alert(error.message));
				});
			e.stopPropagation();
			e.preventDefault();
		});
		file.on('change',(e) => {
			if (e.currentTarget.files)
			{
				tis.file(url,'POST',{'X-Requested-With':'XMLHttpRequest'},{name:'file',dir:dir,files:e.currentTarget.files})
				.then((resp) => {
					var files=JSON.parse(resp).files;
					if (files.length!=0) addcallback(files);
				})
				.catch((error) => tis.alert(error.message));
			}
		});
	}
	/* page create */
	pagecreate(publish,url,deletefile,callback){
		if (publish)
		{
			var keys={};
			if (deletefile) keys['deletefile']=deletefile;
			tis.alert('引き続き各ページの生成を行います',() => {
				tis.request(url,'GET',{'X-Requested-With':'XMLHttpRequest'},{keys:keys})
				.then((resp) => {tis.alert('生成完了',() => callback());})
				.catch((error) => tis.alert(error.message));
			});
		}
		else callback();
	}
	/* submit */
	submit(type,records,id,url,target,callback,countup=true,confirm=true,alert=true){
		switch (type)
		{
			case 'bulk':
				if (records.length!=0)
				{
					for (var i=0;i<records.length;i++)
						if ('id' in records[i])
							if (!records[i].id)
							{
								if (countup) id++;
								records[i].id=id.toString();
							}
					if (confirm)
					{
						tis.confirm('入力したデータを送信します',() => {
							tis.request(url,'PUT',{'X-Requested-With':'XMLHttpRequest'},{target:target,type:'bulk',records:records})
							.then((resp) => {
								if (alert) tis.alert('登録しました',() => {if (callback) callback(id)});
								else
								{
									if (callback) callback(id);
								}
							})
							.catch((error) => tis.alert(error.message));
						});
					}
					else
					{
						tis.request(url,'PUT',{'X-Requested-With':'XMLHttpRequest'},{target:target,type:'bulk',records:records})
						.then((resp) => {
							if (alert) tis.alert('登録しました',() => {if (callback) callback(id)});
							else
							{
								if (callback) callback(id);
							}
						})
						.catch((error) => tis.alert(error.message));
					}
				}
				else
				{
					if (alert) tis.alert('登録しました',() => {if (callback) callback(id)});
					else
					{
						if (callback) callback(id);
					}
				}
				break;
			case 'overwrite':
				if (records.records.length!=0)
				{
					for (var i=0;i<records.records.length;i++)
						if ('id' in records.records[i])
							if (!records.records[i].id)
							{
								if (countup) id++;
								records.records[i].id=id.toString();
							}
					if (confirm)
					{
						tis.confirm('入力したデータを送信します',() => {
							tis.request(url,'PUT',{'X-Requested-With':'XMLHttpRequest'},{target:target,type:'overwrite',keys:records.keys,records:records.records})
							.then((resp) => {
								if (alert) tis.alert('登録しました',() => {if (callback) callback(id)});
								else
								{
									if (callback) callback(id);
								}
							})
							.catch((error) => tis.alert(error.message));
						});
					}
					else
					{
						tis.request(url,'PUT',{'X-Requested-With':'XMLHttpRequest'},{target:target,type:'overwrite',keys:records.keys,records:records.records})
						.then((resp) => {
							if (alert) tis.alert('登録しました',() => {if (callback) callback(id)});
							else
							{
								if (callback) callback(id);
							}
						})
						.catch((error) => tis.alert(error.message));
					}
				}
				else
				{
					if (alert) tis.alert('登録しました',() => {if (callback) callback(id)});
					else
					{
						if (callback) callback(id);
					}
				}
				break;
			case 'single':
				var body={};
				var method='';
				if (!records.id)
				{
					body={
						target:target,
						records:[records]
					};
					method='POST';
				}
				else
				{
					body={
						target:target,
						type:'single',
						record:records
					};
					method='PUT';
				}
				if (confirm)
				{
					tis.confirm('入力したデータを送信します',() => {
						tis.request(url,method,{'X-Requested-With':'XMLHttpRequest'},body)
						.then((resp) => {
							var id=(records.id)?records.id:JSON.parse(resp).id;
							if (alert) tis.alert('登録しました',() => {if (callback) callback(id)});
							else
							{
								if (callback) callback(id);
							}
						})
						.catch((error) => tis.alert(error.message));
					});
				}
				else
				{
					tis.request(url,method,{'X-Requested-With':'XMLHttpRequest'},body)
					.then((resp) => {
						var id=(records.id)?records.id:JSON.parse(resp).id;
						if (alert) tis.alert('登録しました',() => {if (callback) callback(id)});
						else
						{
							if (callback) callback(id);
						}
					})
					.catch((error) => tis.alert(error.message));
				}
				break;
		}
	}
};
class stepbypicker{
	/* constructor */
	constructor(segments,columninfos,related,url,target,keys,sort){
		var div=tis.create('div');
		var img=tis.create('img');
		var select=tis.create('select');
		var td=tis.create('td');
		var th=tis.create('th');
		/* initialize valiable */
		div.css({
			boxSizing:'border-box',
			position:'relative'
		});
		img.css({
			backgroundColor:'transparent',
			border:'none',
			boxSizing:'border-box',
			cursor:'pointer',
			display:'block',
			height:'2em',
			margin:'0px',
			position:'absolute',
			top:'0.25em',
			width:'2em'
		});
		select.css({
			backgroundColor:'transparent',
			border:'none',
			boxSizing:'border-box',
			display:'inline-block',
			fontSize:'1em',
			height:'2em',
			lineHeight:'2em',
			margin:'0px',
			outline:'none',
			padding:'0px 2.5em 0px 0.5em',
			position:'relative',
			verticalAlign:'top',
			width:'100%',
			appearance:'none',
			mozAppearance:'none',
			webkitAppearance:'none'
		})
		td.css({
			border:'none',
			borderBottom:'1px solid #42a5f5',
			boxSizing:'border-box',
			cursor:'pointer',
			lineHeight:'1.5em',
			margin:'0px',
			padding:'0.25em 0.5em'
		});
		th.css({
			border:'none',
			boxSizing:'border-box',
			fontWeight:'normal',
			lineHeight:'2em',
			margin:'0px',
			padding:'0px',
			position:'-webkit-sticky',
			position:'sticky',
			textAlign:'center',
			top:'0',
			zIndex:'2'
		});
		/* setup properties */
		this.limit=50;
		this.offset=0;
		this.callback=null;
		this.columninfos=columninfos;
		this.keys=keys;
		this.related=related;
		this.segments=segments;
		this.sort=sort;
		this.target=target;
		this.url=url;
		this.filter=[];
		this.records=[];
		this.cover=div.clone().css({
			backgroundColor:'rgba(0,0,0,0.5)',
			display:'none',
			height:'100%',
			left:'0px',
			position:'fixed',
			top:'0px',
			width:'100%',
			zIndex:'999997'
		});
		this.container=div.clone().css({
			backgroundColor:'#ffffff',
			borderRadius:'0.5em',
			boxShadow:'0px 0px 3px rgba(0,0,0,0.35)',
			height:'calc('+(Object.keys(this.segments).length*2.5+28.5).toString()+'em + '+(Object.keys(this.segments).length+14).toString()+'px)',
			left:'50%',
			maxHeight:'calc(100% - 1em)',
			maxWidth:'calc(100% - 1em)',
			padding:'calc('+(Object.keys(this.segments).length*2.5).toString()+'em + '+(Object.keys(this.segments).length-1).toString()+'px) 0px 0.5em 0px',
			position:'absolute',
			top:'50%',
			transform:'translate(-50%,-50%)',
		});
		this.contents=div.clone().css({
			height:'100%',
			overflowX:'hidden',
			overflowY:'auto',
			padding:'0px',
			textAlign:'center',
			width:'100%'
		});
		this.buttons=div.clone().css({
			borderBottom:'1px solid #42a5f5',
			left:'0px',
			padding:'0.25em 0px',
			position:'absolute',
			top:'0px',
			width:'100%',
			zIndex:'2'
		});
		this.prev=img.clone()
		.css({right:'4.25em'})
		.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAjZJREFUeNpiYKAJ6J8y8T+MzYIm0QCk6pHFmNA016ObhqKgMCefkfoOBggg6vr9Psz/LLgCBcVb6BI4gxSvQqJMAQggugYDinNYSNVAUDOxHmbCJghNRo2ENDMSG+VASoGq6RMggIY7Agbae6Limdh4ZyGgaT2QCiAphRGbyliwaALZtJ7s5EksYCTF2ehJE6fNUIUbqFIIUFQuYUskAwcAAmgUUTP3F5CUpSi0DD07TqCZxUDLQBXBfVL1sZBpmQCQoiiPsJCRIQWoES3ENAn2AykHaic+Rlr6GF8DgJGWcUx1i4lN1TS1GF8+HpC2FqGSa+QBgAAaRaNgFBBVcJDVm6BCL4uo2ouFShYaAKnzNG/6oFkKstCALm0uarS7mMi0tJ+ujT1i+79UtRhav/ZTKwewUDubULN5S5MRO4KJC9pu+kB3i6GWC4KoAWvQkxL0hFqYJOdjqIET6BLUWCwHBbsg3S2GWv4B6vsLdLUYyQGGQMqQ5omL2IKG6omL3tluFIwCkgFAgPbN6AZAGASi1XQQR3BD3aSrGhLilzZqoQK9iwu8RLnrUfFAEORKbla63NNSRbq21KPZOCQFqJIqC133wAxJt2FU+uZsCHRPF9d+QgFzq7FJlwymgHk/U3pCdgfmgpMm7PL3p5MVIU8bsTQUpbtxcRsxB6xtI9Ka02CaPL7SLdFSLUtrDi2TwJq2ZB5YOni4ApaIlm6Bvx4eQgC/8fVQwE9sLizwnc3hbwMIgobRAdIK28oCHbudAAAAAElFTkSuQmCC')
		.on('click',(e) => {
			this.offset-=this.limit;
			/* search records */
			this.search();
		});
		this.next=img.clone()
		.css({right:'2.25em'})
		.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAi1JREFUeNpiYKAa6J8y8T8Q30cXZ0LjK4AU4lMANw3GZkGXLMzJZ2QgpIskABBAVPI/Xr9DA6gBn7/rcUri9DNJACCAaO9lXICRkGZ8HmQkxWZ0g5iIdGEjNhew4NHwAKhBkWaBCxBAwwUBo+o9sWqxRZUAsamMiUDJtJ4szVAQgM8VTMRmFiAOIEszLsBCjCJcOYuQzRvwZUkWUm2jWiIZOAAQQKMIW8QV0MJcRmKyExI3EJjsNgyExchAEeiIBwNhMTIQBDriw0BYDAMfgA4QHAiLkcEBoCMcKSo1aeFjallMchxTYjFFqZpUi6mWjwes5Bp5ACCARtEoGJlNn/+0KESI7RD0U7vRTEpPRADqewN6WwwD54GWnx/Ixh5Z9TBVOn1A8B7osP6BsBgECshplzENVLZjona2JzbbUdtiogdDaGHxB2K69dS2uJDe7WqSBy+o4eMJ5IyYUOpjsksuci2+ALTQkBIXk2OxIdDSC5TGDwuJ2USQWomRidrZZBSMggEHAAHaNaMbAEEYiBLDgo7AJo7gaI7gCI5giMSAn0LLNb0XBuAlhF4LXIQQU3Q/vZfcnsPI2jNPtSZck+e66W/utCjcpPzw/DC4vAjXZPHNk/DbDxT53YvwVz6pvecACNec5aY/vAg3zb5UmUMVFitzFoSHlrklOCMa2OPQI40qLHZpIQmrlKXZwurBI06SnBYtNYUhmgdpYbj2UEIYegAwStjMiIcQQkxxA49895hLUEtfAAAAAElFTkSuQmCC')
		.on('click',(e) => {
			this.offset+=this.limit;
			/* search records */
			this.search();
		});
		this.close=img.clone()
		.css({right:'0.25em'})
		.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA9pJREFUeNpiYKAUMMIY/VMmvgdSAjB+YU4+WI4JSbFAQXYeA5KG/+gKGCZMncSArAhDAUyRm7MriCmI4gZkY0GSQDd8IMoXAAFEHf//RxL/ALRbkAldAuo1AQxvgSRA3kL3syDIn8gS6HaCjHqPHN54AUAAUceraMENdwISwAh6RmyaQJ7btXc3ik4kMbgh6CkAbBtMIyjoYEkGybD3OJMPephjS3M4/YyezNEAONqpEtoAATREEa5Egh5oWAMKW2j/x2UTeoJnwqYxMyUdRROMj24wzkQC04BuEDJgRrK1AUg5gNhnzp1lMDUyYbCxtGb4+/cvw/Q5M+EaPLw8GXdu23EAr80kA5CfQPjHjx9gjM4m2s8wpyI7mXZRhaTgA5bcxDh40jZAAI3mZmLToQMsF0DBAWBEHqC6xUCL1gOpABLM3QB0SCDZFpNhIdEOYMRjKUrhCSqJ2NnZGX7+/Ik1h+KRJ67QRYrD/biKRGQLCDkIChzR0wALDoUOhMol5BofvW2Ew7wDxBR8B/BVAiALQT4EWQiiQXx8lQI28wZXHA9oqh7QfEzLkmvkAYAAGkWjYNC1QAqQilNQkTiBZhZDG/31BJQ1Ah3RQBWLcXS5CQGCoyFMBCw1IMNScE8cqpc8i4HgPAXp5zxZFkPrY5ShAlERUZwGgeTQhxDQzSBoMTReMYYWosMjsVoOEgPJYQECULOI9vF6dIGlK5djtRzZUpgaQmbhsxijsff6zWsMy9EtBakhtuFIUv8a3XIiLCU7VWO1HHk0DMQm1VKyLAYFL3Q8FT4Ehy+1U8Vi9DjFleAosfgAIUtBwYstwRHbOcBlcSC2PIwtIaFbToxZOC2GFvAfsOVlbAkJ2XIsIy8fyOkf/6ekssc33EMocRlSYK/hoKyPB28LhFZtrlEw/AFAgPas6AZBIIZeiAM5gNG4gTH+KyM4gSPoBuq/MW5gNA7AJrCBXrEm98HJtQVE6Av9BO6l7bV91UehUHRfhQismlAxQfpcmi/St6chPZq3FJq1mjC2Bhvj35tzkGFPs2sFYRQ59taGDURkYi225JPGCWPIXhsiWkR8ygn5SBC66Y/IGvxviueo18Nlc4SrcMHm6XQ5kwQKmKwXs3m+ufqgZH8XPLOQCVuyK8xX0oFDiHPfQ0BeH+og/JR4qoiAkGjQ4M8diSFfttQU8BG6Pe5mMhqLibqcQ0rXgPBBVm2Fw8MG2SUO5uqBQqKk80WmZ6B4mNXmhYQ0GMiPQk9nemkJPZxf/1WXJV+OEz0ea+NRZS/NLVE1YE2dono3POh4qAJAxyQehUKh+Cu8AL45fzrg+n0KAAAAAElFTkSuQmCC')
		.on('click',(e) => this.hide());
		/* create table */
		this.table=tis.create('table').css({
			borderCollapse:'collapse',
			width:'100%'
		})
		.append(tis.create('thead').append(tis.create('tr')))
		.append(tis.create('tbody').append(tis.create('tr')));
		for (var key in this.columninfos)
		{
			this.table.elm('thead tr').append(
				th.clone().css({
					display:(('display' in this.columninfos[key])?this.columninfos[key].display:'table-cell'),
					width:(('width' in this.columninfos[key])?this.columninfos[key].width:'auto')
				})
				.append(
					tis.create('div').css({
						backgroundColor:'#ffffff',
						borderBottom:'1px solid #42a5f5',
						boxSizing:'border-box',
						padding:'0px 0.5em',
						position:'relative'
					})
					.html(('text' in this.columninfos[key])?this.columninfos[key].text:'')
				)
			);
			this.table.elm('tbody tr').append(
				td.clone().css({
					display:(('display' in this.columninfos[key])?this.columninfos[key].display:'table-cell'),
					textAlign:(('align' in this.columninfos[key])?this.columninfos[key].align:'left')
				})
				.attr('id',key)
			);
		}
		/* append elements */
		tis.elm('body')
		.append(
			this.cover
			.append(
				this.container
				.append(
					this.contents
					.append(
						this.table.spread((row,index) => {
							row.on('click',(e) => {
								var res={record:this.filter[index-1]};
								for (var key in this.segments)
								{
									res[key]=this.segments[key].records.filter((record) => {
										return record[this.segments[key].value]==this.segments[key].element.val();
									})[0];
								}
								if (this.callback) this.callback(res);
								this.hide();
							});
						})
					)
				)
				.append(this.buttons)
			)
		);
		for (var key in this.segments)
		{
			this.segments[key]['element']=select.clone().attr('id',key).on('change',(e) => this.pickupsegment(e.currentTarget.attr('id')));
			if (key==Object.keys(this.segments).first()) this.segments[key].element.assignoption(this.segments[key].records,this.segments[key].display,this.segments[key].value);
			if (key==Object.keys(this.segments).last()) this.buttons.append(this.segments[key].element);
			else
			{
				this.buttons.append(this.segments[key].element);
				this.buttons.append(
					div.clone().css({
						backgroundColor:'#42a5f5',
						height:'1px',
						margin:'0.25em 0px',
						padding:'0px',
						width:'100%'
					})
				);
			}
		}
		this.buttons
		.append(this.close)
		.append(this.next.hide())
		.append(this.prev.hide());
		this.pickupsegment(Object.keys(this.segments).first());
	}
	/* search segment */
	pickupsegment(key){
		var row=null;
		var keys=JSON.parse(JSON.stringify(this.keys));
		/* initialize elements */
		((segments,target) => {
			var hit=false;
			for (var key in segments)
			{
				if (hit)
				{
					segments[key].element.empty()
					.append(
						tis.create('option')
						.attr('value','')
						.html('選択して下さい')
					);
				}
				if (key==target) hit=true;
			}
		})(this.segments,key);
		this.records=[];
		this.table.clearrows();
		if (this.segments[key].element.val())
		{
			if (key!=Object.keys(this.segments).last())
			{
				((segments,target) => {
					var hit=false;
					var records=[];
					for (var key in segments)
					{
						if (hit)
						{
							records=segments[key].records.filter((record) => {
								return record[segments[key].related]==this.segments[target].element.val();
							});
							segments[key].element.assignoption(records,segments[key].display,segments[key].value);
							break;
						}
						if (key==target) hit=true;
					}
				})(this.segments,key);
				this.prev.hide();
				this.next.hide();
				this.segments[Object.keys(this.segments).first()].element.css({paddingRight:'2.5em'});
			}
			else
			{
				keys['display']='0';
				keys[this.related]=this.segments[key].element.val();
				tis.extend.bulkcollect([],this.url,{target:this.target,keys:keys,sort:this.sort},true,(records) => {
					this.records=records;
					this.offset=0;
					/* search records */
					this.search();
				});
			}
		}
	}
	/* search records */
	search(){
		var row=null;
		/* append records */
		this.filter=[];
		this.table.clearrows();
		for (var i=this.offset;i<this.offset+this.limit;i++)
			if (i<this.records.length)
			{
				row=this.table.addrow();
				for (var key in this.columninfos) row.elm('#'+key).html(this.records[i][key]);
				this.filter.push(this.records[i]);
			}
		if (this.records.length>this.limit)
		{
			if (this.offset>0) this.prev.show();
			else this.prev.hide();
			if (this.offset+this.limit<this.records.length) this.next.show();
			else this.next.hide();
			this.segments[Object.keys(this.segments).first()].element.css({paddingRight:'6.5em'});
		}
		else
		{
			this.prev.hide();
			this.next.hide();
			this.segments[Object.keys(this.segments).first()].element.css({paddingRight:'2.5em'});
		}
	}
	/* show records */
	show(callback){
		/* setup callback */
		if (callback) this.callback=callback;
		/* show */
		this.cover.css({display:'block'})
	}
	/* hide records */
	hide(){
		this.cover.css({display:'none'});
	}
};
tis.extend=new tislibraryextend();
