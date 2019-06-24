import React, { Component } from 'react'
import {Mutation} from 'react-apollo'
import gql from 'graphql-tag'
import Router from 'next/router'
import Form from './styles/Form'
import formatMoney from '../lib/formatMoney'
import Error from './ErrorMessage'

//Mutation to create an item
const CREATE_ITEM_MUTATION = gql`
    mutation CREATE_ITEM_MUTATION(
        # args that this fuction is allow to accept and types
        $title: String!
        $description: String!
        $price: Int!
        $image: String
        $largeImage: String
    ) {
        createItem(
            # passing the mutation the arg as variables
            title: $title
            description: $description
            price: $price
            image: $image
            largeImage: $largeImage
        ) {
            # outputs the id once created
            id
        }
    }
`;

export default class CreateItem extends Component {
    state = {
        title: "",
        description: "",
        image: "",
        largeImage: "",
        price: ""
    };

    handleChange = (e) => {
        const {name, type, value} = e.target
        const val = type === 'number' ? parseFloat(value) : value;
        this.setState({[name]: val})
    }

     uploadFile = async e => {
        console.log('Uploading file...')
        const files = e.target.files;
        const data = new FormData();
        data.append('file', files[0]);
        data.append('upload_preset', 'nerdstore');

        const res = await fetch('https://api.cloudinary.com/v1_1/nrdevjae/image/upload', {
            method: 'POST',
            body: data
        })

        const file = await res.json();
        console.log(file)
        this.setState({
            image: file.secure_url,
            largeImage: file.eager[0].secure_url
        });
    }
  render() {
    return (
    <Mutation mutation={CREATE_ITEM_MUTATION} variables={this.state}>
        {(createItem, {loading, error}) => (
            <Form onSubmit={async e => {
                e.preventDefault();
                const res = await createItem();
                console.log(res)
                Router.push({
                    pathname: '/item',
                    query: {id: res.data.createItem.id}
                })

            }}>
            <h2>Sell an Item.</h2>
                <Error error={error} />
                <fieldset disabled={loading} aria-busy={loading}>
                    <label htmlFor="title">Image</label>
                    <input
                        type="file"
                        id="file"
                        name="file"
                        placeholder="Upload an image"
                        onChange={this.uploadFile}
                        required
                    />
                    {this.state.image && <img src={this.state.image} width="200" alt="Upload preview" />}
                    <label htmlFor="title">Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        placeholder="Title"
                        value={this.state.title}
                        onChange={this.handleChange}
                        required
                    />
                    <label htmlFor="title">Price</label>
                    <input
                        type="text"
                        id="price"
                        name="price"
                        placeholder="Price"
                        value={this.state.price}
                        onChange={this.handleChange}
                        required
                    />
                    <label htmlFor="title">Description</label>
                    <input
                        type="text"
                        id="description"
                        name="description"
                        placeholder="Enter a description"
                        value={this.state.description}
                        onChange={this.handleChange}
                        required
                    />
                    <button>Submit</button>
                </fieldset>
            </Form>
      )}
    </Mutation>
    )
  }
}

export {CREATE_ITEM_MUTATION};