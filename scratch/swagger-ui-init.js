
window.onload = function() {
  // Build a system
  var url = window.location.search.match(/url=([^&]+)/);
  if (url && url.length > 1) {
    url = decodeURIComponent(url[1]);
  } else {
    url = window.location.origin;
  }
  var options = {
  "swaggerDoc": {
    "openapi": "3.0.0",
    "info": {
      "title": "BentLabKids API",
      "version": "1.0.0",
      "description": "Authentication, user management, and content API for BentLabKids."
    },
    "servers": [
      {
        "url": "http://localhost:5000",
        "description": "Development server"
      },
      {
        "url": "https://bentlabkids-api.onrender.com",
        "description": "Production server"
      }
    ],
    "security": [
      {
        "sessionCookie": []
      }
    ],
    "paths": {
      "/api/v1/sign-up": {
        "post": {
          "security": [],
          "tags": [
            "Auth"
          ],
          "summary": "Register a new user",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/SignUpInput"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "User created",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/User"
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "$ref": "#/components/responses/ValidationError"
            },
            "409": {
              "$ref": "#/components/responses/ConflictError"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        }
      },
      "/api/v1/sign-in": {
        "post": {
          "security": [],
          "tags": [
            "Auth"
          ],
          "summary": "Sign in with email and password",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/SignInInput"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Signed in",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "user": {
                            "$ref": "#/components/schemas/User"
                          },
                          "session": {
                            "$ref": "#/components/schemas/Session"
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "$ref": "#/components/responses/ValidationError"
            },
            "401": {
              "$ref": "#/components/responses/UnauthorizedError"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        }
      },
      "/api/v1/sign-out": {
        "post": {
          "tags": [
            "Auth"
          ],
          "summary": "Sign out",
          "responses": {
            "200": {
              "description": "Signed out",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "message": {
                        "type": "string"
                      }
                    }
                  }
                }
              }
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        }
      },
      "/api/v1/me": {
        "get": {
          "tags": [
            "Auth"
          ],
          "summary": "Get current user",
          "responses": {
            "200": {
              "description": "Current user",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/User",
                        "nullable": true
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "$ref": "#/components/responses/UnauthorizedError"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        }
      },
      "/api/v1/forgot-password": {
        "post": {
          "security": [],
          "tags": [
            "Auth"
          ],
          "summary": "Request password reset",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ForgotPasswordInput"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Reset link sent",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "message": {
                        "type": "string"
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "$ref": "#/components/responses/ValidationError"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        }
      },
      "/api/v1/reset-password": {
        "post": {
          "security": [],
          "tags": [
            "Auth"
          ],
          "summary": "Reset password with token",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ResetPasswordInput"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Password reset",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "message": {
                        "type": "string"
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "$ref": "#/components/responses/ValidationError"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        }
      },
      "/api/v1/admin/upload": {
        "post": {
          "tags": [
            "Admin / Upload"
          ],
          "summary": "Upload images and/or video",
          "description": "Upload up to 10 images (jpg, png, webp, max 5MB each) and/or one video (mp4, webm, mov, max 500MB) with an optional thumbnail.",
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "images": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "format": "binary"
                      },
                      "description": "Image files (up to 10)"
                    },
                    "video": {
                      "type": "string",
                      "format": "binary",
                      "description": "Video file (mp4, webm, mov)"
                    },
                    "thumbnail": {
                      "type": "string",
                      "format": "binary",
                      "description": "Video thumbnail (jpg, png, webp)"
                    },
                    "title": {
                      "type": "string",
                      "description": "Required when sending a video"
                    },
                    "description": {
                      "type": "string"
                    },
                    "categoryId": {
                      "type": "string"
                    },
                    "ageGroup": {
                      "type": "string",
                      "enum": [
                        "TODDLER",
                        "PRESCHOOL",
                        "EARLY",
                        "KIDS"
                      ]
                    },
                    "tags": {
                      "type": "string",
                      "description": "Comma-separated tag names"
                    },
                    "status": {
                      "type": "string",
                      "enum": [
                        "DRAFT",
                        "PUBLISHED",
                        "SCHEDULED"
                      ]
                    },
                    "scheduledFor": {
                      "type": "string",
                      "format": "date-time"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "$ref": "#/components/responses/MediaUploadResponse"
            },
            "400": {
              "$ref": "#/components/responses/ValidationError"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        }
      },
      "/api/v1/admin/uploads": {
        "get": {
          "tags": [
            "Admin / Upload"
          ],
          "summary": "List all uploaded media (images + videos)",
          "description": "Returns both Cloudinary images and Prisma videos. Use 'type' to filter: 'image', 'video', or 'all' (default). Images use cursor pagination; videos use page/limit.",
          "parameters": [
            {
              "name": "type",
              "in": "query",
              "required": false,
              "schema": {
                "type": "string",
                "enum": [
                  "all",
                  "image",
                  "video"
                ],
                "default": "all"
              },
              "description": "Filter by media type"
            },
            {
              "name": "imageCursor",
              "in": "query",
              "required": false,
              "schema": {
                "type": "string"
              },
              "description": "Cloudinary pagination cursor (for images)"
            },
            {
              "name": "videoPage",
              "in": "query",
              "required": false,
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "name": "videoLimit",
              "in": "query",
              "required": false,
              "schema": {
                "type": "integer",
                "default": 20
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/UploadsListResponse"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        }
      },
      "/api/v1/admin/tags": {
        "get": {
          "tags": [
            "Admin / Tags"
          ],
          "summary": "List all tags",
          "responses": {
            "200": {
              "description": "Tags",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "array",
                        "items": {
                          "$ref": "#/components/schemas/Tag"
                        }
                      }
                    }
                  }
                }
              }
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        }
      },
      "/api/v1/admin/stats": {
        "get": {
          "tags": [
            "Admin / Dashboard"
          ],
          "summary": "Get dashboard statistics",
          "responses": {
            "200": {
              "$ref": "#/components/responses/DashboardResponse"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        }
      },
      "/api/v1/admin/categories": {
        "post": {
          "tags": [
            "Admin / Categories"
          ],
          "summary": "Create a category",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateCategoryInput"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Created",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/Category"
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "$ref": "#/components/responses/ValidationError"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        },
        "get": {
          "tags": [
            "Admin / Categories"
          ],
          "summary": "List categories",
          "parameters": [
            {
              "name": "type",
              "in": "query",
              "required": false,
              "schema": {
                "type": "string",
                "enum": [
                  "BIBLE_STORY",
                  "PRAYER",
                  "VIDEO"
                ]
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Categories",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "array",
                        "items": {
                          "$ref": "#/components/schemas/Category"
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "$ref": "#/components/responses/ValidationError"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        }
      },
      "/api/v1/admin/categories/slug/{slug}": {
        "get": {
          "tags": [
            "Admin / Categories"
          ],
          "summary": "Get category by slug",
          "parameters": [
            {
              "name": "slug",
              "in": "path",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Category",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/Category"
                      }
                    }
                  }
                }
              }
            },
            "404": {
              "$ref": "#/components/responses/NotFoundError"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        }
      },
      "/api/v1/admin/categories/{id}": {
        "get": {
          "tags": [
            "Admin / Categories"
          ],
          "summary": "Get category by ID",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Category",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/Category"
                      }
                    }
                  }
                }
              }
            },
            "404": {
              "$ref": "#/components/responses/NotFoundError"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        },
        "patch": {
          "tags": [
            "Admin / Categories"
          ],
          "summary": "Update a category",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateCategoryInput"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Updated",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/Category"
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "$ref": "#/components/responses/ValidationError"
            },
            "404": {
              "$ref": "#/components/responses/NotFoundError"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        },
        "delete": {
          "tags": [
            "Admin / Categories"
          ],
          "summary": "Soft-delete a category",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Deleted",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "message": {
                        "type": "string"
                      }
                    }
                  }
                }
              }
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        }
      },
      "/api/v1/admin/stories": {
        "post": {
          "tags": [
            "Admin / Stories"
          ],
          "summary": "Create a Bible story",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateContentInput"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Created",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/Content"
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "$ref": "#/components/responses/ValidationError"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        },
        "get": {
          "tags": [
            "Admin / Stories"
          ],
          "summary": "List stories",
          "parameters": [
            {
              "name": "categoryId",
              "in": "query",
              "required": false,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "status",
              "in": "query",
              "required": false,
              "schema": {
                "type": "string",
                "enum": [
                  "DRAFT",
                  "PUBLISHED"
                ]
              }
            },
            {
              "name": "ageGroup",
              "in": "query",
              "required": false,
              "schema": {
                "type": "string",
                "enum": [
                  "TODDLER",
                  "PRESCHOOL",
                  "EARLY",
                  "KIDS"
                ]
              }
            },
            {
              "name": "search",
              "in": "query",
              "required": false,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Stories",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "array",
                        "items": {
                          "$ref": "#/components/schemas/Content"
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "$ref": "#/components/responses/ValidationError"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        }
      },
      "/api/v1/admin/stories/slug/{slug}": {
        "get": {
          "tags": [
            "Admin / Stories"
          ],
          "summary": "Get story by slug",
          "parameters": [
            {
              "name": "slug",
              "in": "path",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Story",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/Content"
                      }
                    }
                  }
                }
              }
            },
            "404": {
              "$ref": "#/components/responses/NotFoundError"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        }
      },
      "/api/v1/admin/stories/{id}": {
        "get": {
          "tags": [
            "Admin / Stories"
          ],
          "summary": "Get story by ID",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Story",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/Content"
                      }
                    }
                  }
                }
              }
            },
            "404": {
              "$ref": "#/components/responses/NotFoundError"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        },
        "patch": {
          "tags": [
            "Admin / Stories"
          ],
          "summary": "Update a story",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateContentInput"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Updated",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/Content"
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "$ref": "#/components/responses/ValidationError"
            },
            "404": {
              "$ref": "#/components/responses/NotFoundError"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        },
        "delete": {
          "tags": [
            "Admin / Stories"
          ],
          "summary": "Soft-delete a story",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Deleted",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "message": {
                        "type": "string"
                      }
                    }
                  }
                }
              }
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        }
      },
      "/api/v1/admin/stories/{id}/publish": {
        "patch": {
          "tags": [
            "Admin / Stories"
          ],
          "summary": "Publish a story",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Published",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/Content"
                      }
                    }
                  }
                }
              }
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        }
      },
      "/api/v1/admin/stories/{id}/unpublish": {
        "patch": {
          "tags": [
            "Admin / Stories"
          ],
          "summary": "Unpublish a story",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Unpublished",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/Content"
                      }
                    }
                  }
                }
              }
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        }
      },
      "/api/v1/admin/prayers": {
        "post": {
          "tags": [
            "Admin / Prayers"
          ],
          "summary": "Create a prayer",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateContentInput"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Created",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/Content"
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "$ref": "#/components/responses/ValidationError"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        },
        "get": {
          "tags": [
            "Admin / Prayers"
          ],
          "summary": "List prayers",
          "parameters": [
            {
              "name": "categoryId",
              "in": "query",
              "required": false,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "status",
              "in": "query",
              "required": false,
              "schema": {
                "type": "string",
                "enum": [
                  "DRAFT",
                  "PUBLISHED"
                ]
              }
            },
            {
              "name": "ageGroup",
              "in": "query",
              "required": false,
              "schema": {
                "type": "string",
                "enum": [
                  "TODDLER",
                  "PRESCHOOL",
                  "EARLY",
                  "KIDS"
                ]
              }
            },
            {
              "name": "search",
              "in": "query",
              "required": false,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Prayers",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "array",
                        "items": {
                          "$ref": "#/components/schemas/Content"
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "$ref": "#/components/responses/ValidationError"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        }
      },
      "/api/v1/admin/prayers/slug/{slug}": {
        "get": {
          "tags": [
            "Admin / Prayers"
          ],
          "summary": "Get prayer by slug",
          "parameters": [
            {
              "name": "slug",
              "in": "path",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Prayer",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/Content"
                      }
                    }
                  }
                }
              }
            },
            "404": {
              "$ref": "#/components/responses/NotFoundError"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        }
      },
      "/api/v1/admin/prayers/{id}": {
        "get": {
          "tags": [
            "Admin / Prayers"
          ],
          "summary": "Get prayer by ID",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Prayer",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/Content"
                      }
                    }
                  }
                }
              }
            },
            "404": {
              "$ref": "#/components/responses/NotFoundError"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        },
        "patch": {
          "tags": [
            "Admin / Prayers"
          ],
          "summary": "Update a prayer",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateContentInput"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Updated",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/Content"
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "$ref": "#/components/responses/ValidationError"
            },
            "404": {
              "$ref": "#/components/responses/NotFoundError"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        },
        "delete": {
          "tags": [
            "Admin / Prayers"
          ],
          "summary": "Soft-delete a prayer",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Deleted",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "message": {
                        "type": "string"
                      }
                    }
                  }
                }
              }
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        }
      },
      "/api/v1/admin/prayers/{id}/publish": {
        "patch": {
          "tags": [
            "Admin / Prayers"
          ],
          "summary": "Publish a prayer",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Published",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/Content"
                      }
                    }
                  }
                }
              }
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        }
      },
      "/api/v1/admin/prayers/{id}/unpublish": {
        "patch": {
          "tags": [
            "Admin / Prayers"
          ],
          "summary": "Unpublish a prayer",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Unpublished",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/Content"
                      }
                    }
                  }
                }
              }
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        }
      },
      "/api/v1/admin/videos": {},
      "/api/v1/admin/videos/{id}/status": {
        "get": {
          "tags": [
            "Admin / Videos"
          ],
          "summary": "Get video upload status",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/VideoStatus"
            },
            "404": {
              "$ref": "#/components/responses/NotFoundError"
            }
          }
        }
      },
      "/api/v1/admin/videos/{id}": {
        "get": {
          "tags": [
            "Admin / Videos"
          ],
          "summary": "Get video by ID",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/VideoResponse"
            },
            "404": {
              "$ref": "#/components/responses/NotFoundError"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        },
        "patch": {
          "tags": [
            "Admin / Videos"
          ],
          "summary": "Update a video",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateVideoInput"
                }
              }
            }
          },
          "responses": {
            "200": {
              "$ref": "#/components/responses/VideoResponse"
            },
            "400": {
              "$ref": "#/components/responses/ValidationError"
            },
            "404": {
              "$ref": "#/components/responses/NotFoundError"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        },
        "delete": {
          "tags": [
            "Admin / Videos"
          ],
          "summary": "Soft-delete a video",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "$ref": "#/components/responses/DeletedResponse"
            },
            "500": {
              "$ref": "#/components/responses/ServerError"
            }
          }
        }
      }
    },
    "components": {
      "schemas": {
        "SignUpInput": {
          "type": "object",
          "required": [
            "name",
            "email",
            "password"
          ],
          "properties": {
            "name": {
              "type": "string",
              "example": "Jane Doe"
            },
            "email": {
              "type": "string",
              "format": "email",
              "example": "jane@example.com"
            },
            "password": {
              "type": "string",
              "format": "password",
              "minLength": 8,
              "example": "securePass123"
            }
          }
        },
        "SignInInput": {
          "type": "object",
          "required": [
            "email",
            "password"
          ],
          "properties": {
            "email": {
              "type": "string",
              "format": "email",
              "example": "jane@example.com"
            },
            "password": {
              "type": "string",
              "format": "password",
              "example": "securePass123"
            }
          }
        },
        "ForgotPasswordInput": {
          "type": "object",
          "required": [
            "email"
          ],
          "properties": {
            "email": {
              "type": "string",
              "format": "email"
            }
          }
        },
        "ResetPasswordInput": {
          "type": "object",
          "required": [
            "newPassword",
            "token"
          ],
          "properties": {
            "newPassword": {
              "type": "string",
              "format": "password",
              "minLength": 8
            },
            "token": {
              "type": "string"
            }
          }
        },
        "User": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "email": {
              "type": "string",
              "format": "email"
            },
            "emailVerified": {
              "type": "boolean"
            },
            "image": {
              "type": "string",
              "nullable": true
            },
            "role": {
              "type": "string",
              "enum": [
                "USER",
                "ADMIN",
                "SUPER_ADMIN"
              ]
            },
            "status": {
              "type": "string",
              "enum": [
                "ACTIVE",
                "INACTIVE",
                "DISABLED",
                "DELETED"
              ]
            },
            "createdAt": {
              "type": "string",
              "format": "date-time"
            },
            "updatedAt": {
              "type": "string",
              "format": "date-time"
            }
          }
        },
        "Session": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "userId": {
              "type": "string"
            },
            "expiresAt": {
              "type": "string",
              "format": "date-time"
            },
            "ipAddress": {
              "type": "string",
              "nullable": true
            },
            "userAgent": {
              "type": "string",
              "nullable": true
            }
          }
        },
        "CreateCategoryInput": {
          "type": "object",
          "required": [
            "name",
            "slug",
            "type"
          ],
          "properties": {
            "name": {
              "type": "string",
              "example": "Bible Stories"
            },
            "slug": {
              "type": "string",
              "example": "bible-stories"
            },
            "description": {
              "type": "string"
            },
            "type": {
              "type": "string",
              "enum": [
                "BIBLE_STORY",
                "PRAYER",
                "VIDEO"
              ]
            }
          }
        },
        "UpdateCategoryInput": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            },
            "slug": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "type": {
              "type": "string",
              "enum": [
                "BIBLE_STORY",
                "PRAYER",
                "VIDEO"
              ]
            }
          }
        },
        "Category": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "slug": {
              "type": "string"
            },
            "description": {
              "type": "string",
              "nullable": true
            },
            "type": {
              "type": "string",
              "enum": [
                "BIBLE_STORY",
                "PRAYER",
                "VIDEO"
              ]
            },
            "_count": {
              "type": "object",
              "properties": {
                "contents": {
                  "type": "integer"
                },
                "videos": {
                  "type": "integer"
                }
              }
            },
            "createdAt": {
              "type": "string",
              "format": "date-time"
            },
            "updatedAt": {
              "type": "string",
              "format": "date-time"
            }
          }
        },
        "CreateContentInput": {
          "type": "object",
          "required": [
            "title",
            "slug",
            "content"
          ],
          "properties": {
            "title": {
              "type": "string",
              "example": "David and Goliath"
            },
            "slug": {
              "type": "string",
              "example": "david-and-goliath"
            },
            "content": {
              "type": "string"
            },
            "duration": {
              "type": "integer",
              "description": "Reading time in minutes (auto-calculated if omitted)"
            },
            "verseReference": {
              "type": "string"
            },
            "ageGroup": {
              "type": "string",
              "enum": [
                "TODDLER",
                "PRESCHOOL",
                "EARLY",
                "KIDS"
              ]
            },
            "categoryId": {
              "type": "string",
              "description": "Optional — leave empty for uncategorized"
            },
            "image": {
              "type": "string",
              "format": "uri",
              "description": "Cloudinary URL from upload endpoint"
            },
            "tags": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "scheduledFor": {
              "type": "string",
              "format": "date-time",
              "description": "Set to schedule future publishing"
            }
          }
        },
        "UpdateContentInput": {
          "type": "object",
          "properties": {
            "title": {
              "type": "string"
            },
            "slug": {
              "type": "string"
            },
            "content": {
              "type": "string"
            },
            "duration": {
              "type": "integer"
            },
            "verseReference": {
              "type": "string"
            },
            "ageGroup": {
              "type": "string",
              "enum": [
                "TODDLER",
                "PRESCHOOL",
                "EARLY",
                "KIDS"
              ]
            },
            "categoryId": {
              "type": "string"
            },
            "image": {
              "type": "string",
              "format": "uri",
              "description": "Cloudinary URL from upload endpoint"
            },
            "tags": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "status": {
              "type": "string",
              "enum": [
                "DRAFT",
                "PUBLISHED",
                "SCHEDULED"
              ]
            },
            "scheduledFor": {
              "type": "string",
              "format": "date-time",
              "description": "Set to schedule future publishing"
            }
          }
        },
        "Content": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "title": {
              "type": "string"
            },
            "slug": {
              "type": "string"
            },
            "type": {
              "type": "string",
              "enum": [
                "BIBLE_STORY",
                "PRAYER"
              ]
            },
            "content": {
              "type": "string"
            },
            "duration": {
              "type": "integer",
              "nullable": true
            },
            "verseReference": {
              "type": "string",
              "nullable": true
            },
            "ageGroup": {
              "type": "string",
              "nullable": true
            },
            "featuredImage": {
              "type": "string",
              "nullable": true
            },
            "status": {
              "type": "string"
            },
            "scheduledFor": {
              "type": "string",
              "format": "date-time",
              "nullable": true
            },
            "publishedAt": {
              "type": "string",
              "format": "date-time",
              "nullable": true
            },
            "category": {
              "$ref": "#/components/schemas/Category"
            },
            "tags": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "tag": {
                    "$ref": "#/components/schemas/Tag"
                  }
                }
              }
            },
            "createdAt": {
              "type": "string",
              "format": "date-time"
            },
            "updatedAt": {
              "type": "string",
              "format": "date-time"
            }
          }
        },
        "Tag": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "slug": {
              "type": "string"
            }
          }
        },
        "CreateContentForm": {
          "type": "object",
          "required": [
            "title",
            "slug",
            "content",
            "categoryId"
          ],
          "properties": {
            "title": {
              "type": "string",
              "example": "David and Goliath"
            },
            "slug": {
              "type": "string",
              "example": "david-and-goliath"
            },
            "content": {
              "type": "string"
            },
            "duration": {
              "type": "integer"
            },
            "verseReference": {
              "type": "string"
            },
            "ageGroup": {
              "type": "string",
              "enum": [
                "TODDLER",
                "PRESCHOOL",
                "EARLY",
                "KIDS"
              ]
            },
            "categoryId": {
              "type": "string"
            },
            "image": {
              "type": "string",
              "format": "binary",
              "description": "Image file (jpg, png, webp)"
            },
            "tags": {
              "type": "string",
              "description": "Comma-separated tag names, e.g. 'Courage,Faith'"
            }
          }
        },
        "UpdateContentForm": {
          "type": "object",
          "properties": {
            "title": {
              "type": "string"
            },
            "slug": {
              "type": "string"
            },
            "content": {
              "type": "string"
            },
            "duration": {
              "type": "integer"
            },
            "verseReference": {
              "type": "string"
            },
            "ageGroup": {
              "type": "string",
              "enum": [
                "TODDLER",
                "PRESCHOOL",
                "EARLY",
                "KIDS"
              ]
            },
            "categoryId": {
              "type": "string"
            },
            "image": {
              "type": "string",
              "format": "binary",
              "description": "Image file (jpg, png, webp) — omit to keep existing"
            },
            "tags": {
              "type": "string",
              "description": "Comma-separated tag names"
            },
            "status": {
              "type": "string",
              "enum": [
                "DRAFT",
                "PUBLISHED"
              ]
            }
          }
        },
        "Video": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "title": {
              "type": "string"
            },
            "slug": {
              "type": "string"
            },
            "description": {
              "type": "string",
              "nullable": true
            },
            "provider": {
              "type": "string",
              "enum": [
                "BUNNY",
                "YOUTUBE",
                "VIMEO"
              ]
            },
            "externalVideoId": {
              "type": "string",
              "nullable": true
            },
            "playbackUrl": {
              "type": "string",
              "nullable": true
            },
            "thumbnailUrl": {
              "type": "string",
              "nullable": true
            },
            "durationSeconds": {
              "type": "integer",
              "nullable": true
            },
            "processingStatus": {
              "type": "string",
              "enum": [
                "PROCESSING",
                "READY",
                "FAILED"
              ]
            },
            "status": {
              "type": "string"
            },
            "scheduledFor": {
              "type": "string",
              "format": "date-time",
              "nullable": true
            },
            "publishedAt": {
              "type": "string",
              "format": "date-time",
              "nullable": true
            },
            "ageGroup": {
              "type": "string",
              "nullable": true
            },
            "category": {
              "$ref": "#/components/schemas/Category"
            },
            "uploadedBy": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "name": {
                  "type": "string"
                },
                "email": {
                  "type": "string"
                }
              }
            },
            "tags": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "tag": {
                    "$ref": "#/components/schemas/Tag"
                  }
                }
              }
            },
            "createdAt": {
              "type": "string",
              "format": "date-time"
            },
            "updatedAt": {
              "type": "string",
              "format": "date-time"
            }
          }
        },
        "UpdateVideoInput": {
          "type": "object",
          "properties": {
            "title": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "categoryId": {
              "type": "string"
            },
            "ageGroup": {
              "type": "string",
              "enum": [
                "TODDLER",
                "PRESCHOOL",
                "EARLY",
                "KIDS"
              ]
            },
            "tags": {
              "type": "string",
              "description": "Comma-separated tag names"
            },
            "status": {
              "type": "string",
              "enum": [
                "DRAFT",
                "PUBLISHED",
                "SCHEDULED"
              ]
            },
            "scheduledFor": {
              "type": "string",
              "format": "date-time"
            }
          }
        },
        "StatItem": {
          "type": "object",
          "properties": {
            "count": {
              "type": "integer"
            },
            "thisWeek": {
              "type": "integer"
            },
            "growthPct": {
              "type": "integer"
            }
          }
        },
        "DashboardStats": {
          "type": "object",
          "properties": {
            "bibleStories": {
              "$ref": "#/components/schemas/StatItem"
            },
            "prayers": {
              "$ref": "#/components/schemas/StatItem"
            },
            "videos": {
              "$ref": "#/components/schemas/StatItem"
            },
            "categories": {
              "type": "object",
              "properties": {
                "count": {
                  "type": "integer"
                }
              }
            },
            "users": {
              "$ref": "#/components/schemas/StatItem"
            }
          }
        }
      },
      "securitySchemes": {
        "sessionCookie": {
          "type": "apiKey",
          "in": "cookie",
          "name": "better-auth.session_token",
          "description": "Paste your session token from Postman, or sign in via POST /api/v1/sign-in first."
        }
      },
      "responses": {
        "ValidationError": {
          "description": "Validation error",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": {
                    "type": "boolean",
                    "example": false
                  },
                  "message": {
                    "type": "string"
                  },
                  "statusCode": {
                    "type": "integer",
                    "example": 400
                  },
                  "errors": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "field": {
                          "type": "string"
                        },
                        "message": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "UnauthorizedError": {
          "description": "Unauthorized",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": {
                    "type": "boolean",
                    "example": false
                  },
                  "message": {
                    "type": "string"
                  },
                  "statusCode": {
                    "type": "integer",
                    "example": 401
                  },
                  "errors": {
                    "type": "null"
                  }
                }
              }
            }
          }
        },
        "ConflictError": {
          "description": "Conflict",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": {
                    "type": "boolean",
                    "example": false
                  },
                  "message": {
                    "type": "string"
                  },
                  "statusCode": {
                    "type": "integer",
                    "example": 409
                  },
                  "errors": {
                    "type": "null"
                  }
                }
              }
            }
          }
        },
        "NotFoundError": {
          "description": "Not found",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": {
                    "type": "boolean",
                    "example": false
                  },
                  "message": {
                    "type": "string"
                  },
                  "statusCode": {
                    "type": "integer",
                    "example": 404
                  },
                  "errors": {
                    "type": "null"
                  }
                }
              }
            }
          }
        },
        "ServerError": {
          "description": "Server error",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": {
                    "type": "boolean",
                    "example": false
                  },
                  "message": {
                    "type": "string"
                  },
                  "statusCode": {
                    "type": "integer",
                    "example": 500
                  },
                  "errors": {
                    "type": "null"
                  }
                }
              }
            }
          }
        },
        "VideoResponse": {
          "description": "Video",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": {
                    "type": "boolean",
                    "example": true
                  },
                  "data": {
                    "$ref": "#/components/schemas/Video"
                  }
                }
              }
            }
          }
        },
        "VideoStatus": {
          "description": "Video upload status",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": {
                    "type": "boolean",
                    "example": true
                  },
                  "data": {
                    "type": "object",
                    "properties": {
                      "id": {
                        "type": "string"
                      },
                      "processingStatus": {
                        "type": "string",
                        "enum": [
                          "QUEUED",
                          "UPLOADING",
                          "PROCESSING",
                          "READY",
                          "FAILED"
                        ]
                      },
                      "uploadProgress": {
                        "type": "integer"
                      },
                      "failureReason": {
                        "type": "string",
                        "nullable": true
                      },
                      "playbackUrl": {
                        "type": "string",
                        "nullable": true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "VideoList": {
          "description": "Video list",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": {
                    "type": "boolean",
                    "example": true
                  },
                  "data": {
                    "type": "array",
                    "items": {
                      "$ref": "#/components/schemas/Video"
                    }
                  },
                  "meta": {
                    "type": "object",
                    "properties": {
                      "total": {
                        "type": "integer"
                      },
                      "page": {
                        "type": "integer"
                      },
                      "limit": {
                        "type": "integer"
                      },
                      "totalPages": {
                        "type": "integer"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "MediaUploadResponse": {
          "description": "Media uploaded",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": {
                    "type": "boolean",
                    "example": true
                  },
                  "data": {
                    "type": "object",
                    "properties": {
                      "images": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "url": {
                              "type": "string"
                            },
                            "publicId": {
                              "type": "string"
                            },
                            "width": {
                              "type": "integer"
                            },
                            "height": {
                              "type": "integer"
                            }
                          }
                        }
                      },
                      "video": {
                        "type": "object",
                        "properties": {
                          "id": {
                            "type": "string"
                          },
                          "processingStatus": {
                            "type": "string"
                          },
                          "uploadProgress": {
                            "type": "integer"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "UploadsListResponse": {
          "description": "Uploads list",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": {
                    "type": "boolean",
                    "example": true
                  },
                  "data": {
                    "type": "object",
                    "properties": {
                      "images": {
                        "type": "object",
                        "properties": {
                          "images": {
                            "type": "array",
                            "items": {
                              "type": "object",
                              "properties": {
                                "url": {
                                  "type": "string"
                                },
                                "publicId": {
                                  "type": "string"
                                },
                                "width": {
                                  "type": "integer"
                                },
                                "height": {
                                  "type": "integer"
                                },
                                "createdAt": {
                                  "type": "string"
                                }
                              }
                            }
                          },
                          "nextCursor": {
                            "type": "string",
                            "nullable": true
                          }
                        }
                      },
                      "videos": {
                        "type": "object",
                        "properties": {
                          "data": {
                            "type": "array",
                            "items": {
                              "$ref": "#/components/schemas/Video"
                            }
                          },
                          "total": {
                            "type": "integer"
                          },
                          "page": {
                            "type": "integer"
                          },
                          "limit": {
                            "type": "integer"
                          },
                          "totalPages": {
                            "type": "integer"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "DeletedResponse": {
          "description": "Deleted",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": {
                    "type": "boolean",
                    "example": true
                  },
                  "message": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "DashboardResponse": {
          "description": "Dashboard stats",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": {
                    "type": "boolean",
                    "example": true
                  },
                  "data": {
                    "$ref": "#/components/schemas/DashboardStats"
                  }
                }
              }
            }
          }
        }
      }
    },
    "tags": [
      {
        "name": "Auth",
        "description": "Sign-up, sign-in, password reset, and user session"
      },
      {
        "name": "Admin / Categories",
        "description": "Manage content categories"
      },
      {
        "name": "Admin / Dashboard",
        "description": "Dashboard statistics and analytics"
      },
      {
        "name": "Admin / Stories",
        "description": "Manage Bible stories"
      },
      {
        "name": "Admin / Prayers",
        "description": "Manage prayers"
      },
      {
        "name": "Admin / Tags",
        "description": "Browse available tags"
      },
      {
        "name": "Admin / Upload",
        "description": "Upload and list images and videos"
      },
      {
        "name": "Admin / Videos",
        "description": "View, update, and delete individual videos"
      }
    ]
  },
  "customOptions": {}
};
  url = options.swaggerUrl || url
  var urls = options.swaggerUrls
  var customOptions = options.customOptions
  var spec1 = options.swaggerDoc
  var swaggerOptions = {
    spec: spec1,
    url: url,
    urls: urls,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout"
  }
  for (var attrname in customOptions) {
    swaggerOptions[attrname] = customOptions[attrname];
  }
  var ui = SwaggerUIBundle(swaggerOptions)

  if (customOptions.oauth) {
    ui.initOAuth(customOptions.oauth)
  }

  if (customOptions.preauthorizeApiKey) {
    const key = customOptions.preauthorizeApiKey.authDefinitionKey;
    const value = customOptions.preauthorizeApiKey.apiKeyValue;
    if (!!key && !!value) {
      const pid = setInterval(() => {
        const authorized = ui.preauthorizeApiKey(key, value);
        if(!!authorized) clearInterval(pid);
      }, 500)

    }
  }

  if (customOptions.authAction) {
    ui.authActions.authorize(customOptions.authAction)
  }

  window.ui = ui
}
