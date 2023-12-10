//cause -> details 
//opening balance -> not credit (balance 0)
//uncategorized


import { Button, FormControl, Grid, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material'
import { useEffect, useRef } from 'react'
import { useState } from 'react'
import axios from 'axios'
import toast,{Toaster} from 'react-hot-toast';
import {EditableSelect} from 'react-editable-select';

import { DataGrid } from "@mui/x-data-grid";
import moment from 'moment/moment';
     


const EBL=props=>{

    const [pdf,setPdf]=useState(null)
    const [loading,setLoading]=useState(false)

    const [selectedValue,setSelectedValue]=useState(null)

    const passRef=useRef()

    const [search,setSearch]=useState('')
    const [categories,setCategories]=useState([])

    const [totalDebit,setTotalDebit]=useState(0)
    const [totalCredit,setTotalCredit]=useState(0)

    const columns = [
        {
            field: "id",
            flex: 0.5,
            headerName: 'Serial',
         
          },
          {
            field: "category",
            flex: 0.5,
            headerName: 'Category',
            renderCell: (params) => {
                return <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">Category</InputLabel>
                <Select
                    value={params.row.category}
                    label="Category"
                    onChange={e=>{
                        // setSearch(e.target.value)
                        var arr=[]
                        sheetData.map(s=>{
                            if(s.id===params.row.id)
                                s.category=e.target.value
                            arr.push(s)
                        })
                        setSheetData(arr)
                    }}
                >
                    {
                        categories.map(c=>{
                            return(
                                <MenuItem value={c}>{c}</MenuItem>
    
                            )
                        })
                    }
         
                </Select>
                </FormControl>
            } 
          },
        { field: 'bank', headerName: 'Bank', flex: 0.75 },
        { field: 'date', headerName: 'Date', flex: 0.75,
        renderCell: (params) => {
            return <font><b>{params.row.date.toDateString()}</b></font>;
        } },
        { field: 'type', headerName: 'Type', flex: 0.75 ,
            renderCell: (params) => {
                return <font color={params.row.type==='CREDIT'?'#00dd00':'red'}><b>{params.row.type}</b></font>;
            }
        },
                     
        { field: 'amount', headerName: 'Amount', flex: 0.75 ,
        renderCell: (params) => {
            return <font color={params.row.type==='CREDIT'?'#00dd00':'red'}>{params.row.type==='CREDIT'?'':'-'}{params.row.amount}</font>;
        }
        
    },
        { field: 'balance', headerName: 'Balance', flex: 0.75,renderCell: (params) => {
            return <b>{params.row.balance}</b>;
        } },
        { field: 'reason', headerName: 'Details', flex: 1.5
    
            
    },
    // { field: 'employee', headerName: 'By', flex:  0.45   
           
    // },
    //     {
    //       field: 'frequency',
    //       headerName: 'Freq',
    //       type: 'number', flex: 0.25
    //     },
    //     { field: 'comment', headerName: 'Comment',flex: 1.25 },
    
    //     { field: 'updateTime', headerName: 'Updated At',flex: 1 },
       
      ];
    

    const changeHandler=e=>{
        setPdf(e.target.files[0])
    }

    const [start,setStart]=useState(new Date())
    const [end,setEnd]=useState(new Date())

    const [sheetData,setSheetData]=useState(null)

    const lastUpdate=useRef(0)


    const [filteredData,setFilteredData]=useState(null)

    const isIblDate=string=>{
        return string.length===8&&moment(string,'DD/MM/YY').isValid()
    }

    useEffect(()=>{
        var arr=[]
        if(lastUpdate.current===0&&sheetData!==null){
            // console.log(start,end)
            
            sheetData.map(d=>{
                var keywords=search.replace(/\s+/g,' ')
                .replace(/^\s+|\s+$/,'').split(' ')
                var isIn=true
                keywords.map(k=>{
                    if(d.reason.toLowerCase().indexOf(k.toLowerCase())<0 && d.bank.toLowerCase().indexOf(k.toLowerCase())<0 && d.type.toLowerCase().indexOf(k.toLowerCase())<0)
                        isIn=false
                })
                if(isIn && d.date>=start && d.date<=end)arr.push(d)
            })
        }else if(lastUpdate.current===1&&sheetData!==null&&selectedValue!==null){
            // console.log(start,end)
            sheetData.map(d=>{
                if(d.category===selectedValue)arr.push(d)
            })
        }

        var tC=0,tD=0
        arr.map(a=>{
            if(a.type==='CREDIT')tC+=a.amount
            else tD+=a.amount
        })
        setTotalCredit(tC)
        setTotalDebit(tD)

        setFilteredData(arr)

    },[sheetData,search,start,end,selectedValue])


    // useEffect(()=>{
    //     console.log(start,end)
    // },[start,end])

    const uploadClick=async ()=>{
        const password=passRef.current.value
        var bodyFormData = new FormData();
        bodyFormData.append('file', pdf);
        bodyFormData.append('password', password);
        setLoading(true)
        setSheetData(null)
        var result= await axios({
            method: "post",
            url: "https://brainlytic.org/pdf",
            data: bodyFormData,
            headers: { "Content-Type": "multipart/form-data" },
          })
        setLoading(false)
        if(!result.data.success)
          toast.error(result.data.message)
        else{
            var data=result.data
            var transactions=[]

            var regExp = /[a-zA-Z]/g;

            const isAmount=string=>{
                return !regExp.test(string) && parseFloat(string.replaceAll(',',''))!==NaN && string.indexOf('.')>-1 
            }

            const getAmount=string=>{
                return parseFloat(string.replaceAll(',',''))
            }
            
            const isScbDate=string=>{
                return string.length===9&&moment(string,'DD MMM YY').isValid()
            }

            if(data.pages[0].indexOf('ebl')>0){
                data.pages.map((page,pageNo)=>{
                    var lines=page.split('\n')
                    var start=lines.indexOf('e-statement')+1
                    var end=lines.length-4
                    var currentLine=start
                    while(currentLine<=end){
                        if(lines[currentLine]==='STATEMENT CLOSING  BALANCE')
                            return
                        var type=isAmount(lines[currentLine+1])?'CREDIT':'DEBIT'
                        
                        var transac={type,bank:'EBL'}
                        if(type==='CREDIT'){
                            transac['amount']=parseFloat(lines[currentLine].replaceAll(',',''))
                            currentLine++
                            transac['balance']=parseFloat(lines[currentLine].replaceAll(',',''))
                            currentLine++
                            transac['date']=moment(lines[currentLine],'DD-MMM-YYYY').toDate()
                            currentLine++
                            var detailsWithRef=``
    
                            while(currentLine<=end && (regExp.test(lines[currentLine]) || !isAmount(lines[currentLine]))){
                                detailsWithRef+=`${lines[currentLine]}\n`
                                currentLine++
                            }
                            transac['info']=detailsWithRef
                            transactions.push(transac)
                        }else{
                            transac['balance']=parseFloat(lines[currentLine].replaceAll(',',''))
                            currentLine++
                            transac['date']=moment(lines[currentLine],'DD-MMM-YYYY').toDate()
                            currentLine++
                            var detailsWithRef=``
                            while(currentLine<=end && (regExp.test(lines[currentLine]) || !isAmount(lines[currentLine]))){
                                detailsWithRef+=`${lines[currentLine]}\n`
                                currentLine++
                            }
                            transac['info']=detailsWithRef
                            transac['amount']=parseFloat(lines[currentLine].replaceAll(',',''))
                            currentLine++
                            transactions.push(transac)
    
                        }
                        
                    }
                })
            }else if(data.pages[0].indexOf('Islami')>=0){
                data.pages.map((page,pageNo)=>{
                    var lines=[]
                    page.split('\n').map(l=>{
                        if(l.trim().length>0)
                            lines.push(l.trim())
                    })

                    var currentLine=0

                    while(!isIblDate(lines[currentLine]))currentLine++;
                    
                    while(currentLine<lines.length){
                        if(!isIblDate(lines[currentLine])) break
                        var date=lines[currentLine]
                        currentLine++
                        var info=``
                        while(regExp.test(lines[currentLine])||!isAmount(lines[currentLine]))info+=`${lines[currentLine++]}\n`
                        var creditAmount=getAmount(lines[currentLine])
                        currentLine++
                        var debitAmount=getAmount(lines[currentLine])
                        currentLine++
                        var type=debitAmount>0?'DEBIT':'CREDIT'
                        var amount=debitAmount>0?debitAmount:creditAmount
                        var balance=getAmount(lines[currentLine])
                        currentLine+=2
                        var transac={date:moment(date,'DD/MM/YY').toDate(),amount,balance,type,info,bank:'IBBL'}
                        transactions.push(transac)
                    }
                })
            }
            else{
                var currentBalance
                data.pages.map((page,pageNo)=>{
                    var lines=[]
                    page.split('\n').map(l=>{
                        if(l.trim().length>0)
                            lines.push(l.trim())
                    })
                    var currentLine=0
                    if(pageNo===0){
                        var tmpLine=lines.indexOf('BALANCE BROUGHT FORWARD')
                        currentBalance=getAmount(lines[tmpLine+1])
                        currentLine=tmpLine+2
                    }else{
                        var tmpLine=lines.indexOf('Balance')
                        currentLine=tmpLine+1
                    }
                
                    while(currentLine<lines.length){
                        if(!isScbDate(lines[currentLine])) break
                        if(isScbDate(lines[currentLine])&&isScbDate(lines[currentLine+1]))
                            currentLine++
                
                        var date=lines[currentLine]
                        currentLine++
                        var info=``
                        while(regExp.test(lines[currentLine])&&!isAmount(lines[currentLine]))info+=`${lines[currentLine++]}\n`
                        var amount=getAmount(lines[currentLine])
                        currentLine++
                        var balance=getAmount(lines[currentLine])
                        var type=balance>currentBalance?'CREDIT':'DEBIT'
                        currentBalance=balance
                        var transac={date:moment(date,'DD MMM YY').toDate(),amount,balance,type,info,bank:'SCBL'}
                        currentLine++
                        transactions.push(transac)
                    }
                
                })
            }

            

            var arr=[]
            var minDate=new Date('2070-01-01')
            var maxDate=new Date('1970-01-01')

            // console.log(minDate)
            // console.log(maxDate)
            // console.log(transactions)
            transactions.map((t,i)=>{
                // console.log(t.date)
                if(t.date<minDate)minDate=new Date(t.date)
                if(t.date>maxDate)maxDate=new Date(t.date)
                if(i===0&&(t.bank==='EBL'||t.bank==='IBBL'))
                    t.amount=0
                arr.push({
                    date:t.date,
                    amount:t.amount,
                    type:t.type,
                    balance:t.balance,
                    id:i+1,
                    reason:t.info,
                    bank:t.bank,
                    category:null
                })
            })

            minDate.setDate(minDate.getDate()-2)
            maxDate.setDate(maxDate.getDate()+2)

            setStart(minDate)
            setEnd(maxDate)

            // console.log(minDate)
            // console.log(maxDate)

            setSheetData(arr)
        }
        // console.log(result.data)
    }

    return(
        <Grid container spacing={1} padding={1}>
            <Grid item xs={12}>
                <input type="file" accept="application/pdf" name="file" onChange={changeHandler} />
                
            </Grid>
            <Grid item xs={8} md={4}>
                <TextField
                    variant='outlined'
                    label='Password'
                    fullWidth
                    type='password'
                    inputRef={passRef}
                />
            </Grid>
            <Grid item xs={4} md={2}>
                <Button
                    variant='contained'
                    onClick={uploadClick}
                    disabled={pdf===null || loading}
                    fullWidth
                >
                    Analyze
                </Button>
            </Grid>

             <Grid item xs={8} md={2}>
                <TextField
                    variant='outlined'
                    label='Keyword(s)'
                    fullWidth
                    value={search}
                    onChange={e=>{
                        lastUpdate.current=0
                        setSelectedValue(null)
                        setSearch(e.target.value)
                    }}
                />
            </Grid>
            <Grid item xs={4} md={2}>
                <Button
                    variant='outlined'
                    disabled={pdf===null || loading}
                    fullWidth
                    onClick={()=>{
                        setCategories([...categories,search])
                    }}
                >
                    + Category
                </Button>
            </Grid>

            <Grid item xs={4} md={2}>
          
            <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">Category</InputLabel>
                <Select
                    value={selectedValue}
                    label="Category"
                    onChange={e=>{
                        lastUpdate.current=1
                        setSearch('')
                        setSelectedValue(e.target.value)
                    }}
                >
                    {
                        categories.map(c=>{
                            return(
                                <MenuItem value={c}>{c}</MenuItem>

                            )
                        })
                    }
         
                </Select>
                </FormControl>
            </Grid>
            <Grid item xs={4} md={2}>
                    <TextField
                        value={new Date(start.getTime() - (start.getTimezoneOffset() * 60000)).toISOString().split('T')[0]}
                        onChange={e=>{
                            setStart(new Date(e.target.value))
                        }}
                        variant='outlined'
                        fullWidth
                        type='date'
                        label={'From'}
                    />
            </Grid>
            <Grid item xs={4} md={2}>
                    <TextField
                        value={new Date(end.getTime() - (end.getTimezoneOffset() * 60000)).toISOString().split('T')[0]}

                        onChange={e=>{
                            setEnd(new Date(e.target.value))
                        }}
                        variant='outlined'
                        fullWidth
                        type='date'
                        label={'To'}
                    />
            </Grid>
            <Grid item xs={4} md={2}>
                    <Typography variant='body'>
                        <b><u>Total Credit:</u> BDT ${totalCredit}{'/='}</b><br/>
                        <b><u>Total Debit:</u> BDT ${totalDebit}{'/='}</b>
                    </Typography>
            </Grid>
            <Grid item xs={12}>
                {
                    filteredData &&  <DataGrid
                    rows={filteredData?filteredData:[]}
                    columns={columns}
                    initialState={{
                      pagination: {
                        paginationModel: { page: 0, pageSize: 100 },
                      },
                    }}
                    pageSizeOptions={[5, 10]}
                  />
                }
            </Grid>
            <Toaster />
        </Grid>
    )
}

export default EBL